/* global getAssetRegistry getFactory emit */

/**
 * transaction processor function.
 * @param {org.example.shipping.Shipment_Job_Book_Voyage} tx The transaction instance.
 * @transaction
 */
async function shipment_Job_Book_Voyage(tx) {  // eslint-disable-line no-unused-vars
  var factory = getFactory();
  var currentParticipant = getCurrentParticipant();
  const assetRegistry = await getAssetRegistry('org.example.shipping.Container_Voyage');
  const voyageSlotTokenRegistry = await getAssetRegistry('org.example.shipping.VoyageSlot_Token');
  const voyageRegistry = await getAssetRegistry('org.example.shipping.Voyage');
  const shipment_JobRegistry = await getAssetRegistry('org.example.shipping.Shipment_Job');
  
  for (let x = 0; x < tx.shipment_Job.quoteComputedBestVoyages.length; x++) {
    let voyageSlotTokens = await query('getVoyageSlot_Token', 
                                     { "voyage": tx.shipment_Job.quoteComputedBestVoyages[x].toURI(),
                                       "organisation":  tx.shipment_Job.carrier.toURI()});
    
    // Check Tokens
    if (voyageSlotTokens[0].SlotCountBalance_TEU < 1){
      throw new Error('Error: Not enough Voyage Slot Tokens to create booking! Voyage:' + tx.shipment_Job.quoteComputedBestVoyages[x].toURI() + '  Purchaser: ' + tx.shipment_Job.carrier.toURI() + '   Token: ' + voyageSlotTokens[0].toURI() );
    }   
    voyageSlotTokens[0].SlotCountBalance_TEU--;
    await voyageSlotTokenRegistry.update(voyageSlotTokens[0]);
       
    var nextID = 'Container_Voyage_' + tx.containerVoyage_NextID;
    var newContainer_Voyage = factory.newResource('org.example.shipping', 'Container_Voyage', nextID);
    newContainer_Voyage.voyage = tx.shipment_Job.quoteComputedBestVoyages[x];
    newContainer_Voyage.job = tx.shipment_Job;
    newContainer_Voyage.created = tx.timestamp;
    newContainer_Voyage.lastModified = tx.timestamp;
    newContainer_Voyage.lastModifiedByUser = currentParticipant;
    if (tx.shipment_Job.isCustomerSuppliedContainer){
      newContainer_Voyage.container = tx.shipment_Job.Container;
    }
    await assetRegistry.add(newContainer_Voyage);

    tx.shipment_Job.quoteComputedBestVoyages[x].BookedCapacity_TEU += 1;
    await voyageRegistry.update(tx.shipment_Job.quoteComputedBestVoyages[x]);

    tx.containerVoyage_NextID++;
  }
  
  if (tx.shipment_Job.isCustomerSuppliedContainer){
    tx.shipment_Job.jobStatus = 'VoyageAndContainerBooked';
  }else{
    tx.shipment_Job.jobStatus = 'VoyageBooked';
  }
  tx.shipment_Job.lastModified = tx.timestamp;
  tx.shipment_Job.lastModifiedByUser = currentParticipant;
  shipment_JobRegistry.update(tx.shipment_Job);
}




/**
 * transaction processor function.
 * @param {org.example.shipping.Shipment_Job_Book_Container} tx The transaction instance.
 * @transaction
 */
async function shipment_Job_Book_Container(tx) {  // eslint-disable-line no-unused-vars
  var currentParticipant = getCurrentParticipant();
  const shipment_JobRegistry = await getAssetRegistry('org.example.shipping.Shipment_Job');
  const containerYardLocationRegistry = await getAssetRegistry('org.example.shipping.ContainerYardLocation');
  const containerRegistry = await getAssetRegistry('org.example.shipping.Container');
  
  tx.shipment_Job.jobStatus = 'VoyageAndContainerBooked';
  tx.shipment_Job.Container = tx.container;
  tx.shipment_Job.lastModified = tx.timestamp;
  tx.shipment_Job.lastModifiedByUser = currentParticipant;
  shipment_JobRegistry.update(tx.shipment_Job);

  tx.container.containerLocationStatus = 'ContainerYardAwaitingPickup';
  tx.container.isAvalibleForUse = false;
  tx.container.currentJob = tx.shipment_Job;
  containerRegistry.update(tx.container);

  tx.container.currentContainerYardLocation.idleContainers--;
  containerYardLocationRegistry.update(tx.container.currentContainerYardLocation);
}




/**
 * Transaction processor function.
 * @param {org.example.shipping.VoyageToken_PlaceSellOrder} tx The sample transaction instance.
 * @transaction
 */
async function voyageToken_PlaceSellOrder(tx) {  // eslint-disable-line no-unused-vars
  var factory = getFactory();
  var currentParticipant = getCurrentParticipant();

  const carrierEmployeeRegistary = await getParticipantRegistry('org.example.shipping.CarrierEmployee');
  const slotTokenTradeReceiptRegistry = await getAssetRegistry('org.example.shipping.SlotTokenTradeReceipt');
  const slotTokenSellOrderRegistry = await getAssetRegistry('org.example.shipping.SlotTokenSellOrder');  
  const slotTokenBuyOrderRegistry = await getAssetRegistry('org.example.shipping.SlotTokenBuyOrder');
  const voyageSlotTokenRegistry = await getAssetRegistry('org.example.shipping.VoyageSlot_Token');
  
  if (tx.quantity > tx.voyageSlot_Token.SlotCountBalance_TEU + 0.01){
  	return("Error: Not enough Tokens to sell specified quantity");
  }
  
  let slotTokenSellOrders = await query('getSlotTokenSellOrder_ForVoyage', 
                                     { "voyage": tx.voyageSlot_Token.voyage.toURI(),
                                     "organisation":  tx.voyageSlot_Token.Owner.toURI()});
  let slotTokenBuyOrders = await query('getSlotTokenBuyOrder_ForVoyage', 
                                     { "voyage": tx.voyageSlot_Token.voyage.toURI(),
									 "organisation":  tx.voyageSlot_Token.Owner.toURI()});
									 
  let systemUser = await carrierEmployeeRegistary.get("System");
  
  let hasFilledABuyOrder = false;
  let isOrderModifiedBySystem = false;
  let noOfTokensBeingSold = tx.quantity;
  // Optimisation: If the new Sell Order does not satisfy any buy orders, Do not compare agaisnt existing Sell orders because no new buy orders will be satisfyed.
  // Search if any buy Orders Match
  for (let x = 0; x < slotTokenBuyOrders.length; x++) {
  	if(slotTokenBuyOrders[x].buyPriceLimit >= tx.sellPrice){
      if(slotTokenBuyOrders[x].containerSlotQuantity_TEU == tx.quantity){
        //stop new SellOrder Exactly forfills a BuyOrder
        //create recipt and Sell Order
        let newSlotTokenSellOrder = factory.newResource('org.example.shipping', 'SlotTokenSellOrder', tx.nextID + '');
        newSlotTokenSellOrder.seller = tx.voyageSlot_Token.Owner;
        newSlotTokenSellOrder.sellerToken = tx.voyageSlot_Token;
        newSlotTokenSellOrder.sellPriceLimit = tx.sellPrice;
        newSlotTokenSellOrder.voyage = tx.voyageSlot_Token.voyage;
        newSlotTokenSellOrder.createdByUser = currentParticipant;
        newSlotTokenSellOrder.lastModifiedByUser = currentParticipant;
        newSlotTokenSellOrder.created = tx.timestamp;
        newSlotTokenSellOrder.lastModified = tx.timestamp;
        newSlotTokenSellOrder.status = "Forfilled";
        newSlotTokenSellOrder.containerSlotQuantity_TEU = tx.quantity;
        await slotTokenSellOrderRegistry.add(newSlotTokenSellOrder);
        
        slotTokenBuyOrders[x].status = "Forfilled";
        await slotTokenBuyOrderRegistry.update(slotTokenBuyOrders[x]);
        
        let newSlotTokenTradeReceipt = factory.newResource('org.example.shipping', 'SlotTokenTradeReceipt', tx.nextID + '');
        newSlotTokenTradeReceipt.seller = tx.voyageSlot_Token.Owner;
        newSlotTokenTradeReceipt.buyer = slotTokenBuyOrders[x].buyer;
        newSlotTokenTradeReceipt.voyage = tx.voyageSlot_Token.voyage;
        newSlotTokenTradeReceipt.containerSlotQuantity_TEU = tx.quantity;
        newSlotTokenTradeReceipt.sellMinPriceLimit = tx.sellPrice;
        newSlotTokenTradeReceipt.buyMaxPriceLimit = slotTokenBuyOrders[x].buyPriceLimit;
        newSlotTokenTradeReceipt.totalDue = tx.quantity * tx.sellPrice;
        newSlotTokenTradeReceipt.isPaid = false;
        newSlotTokenTradeReceipt.created = tx.timestamp;
        newSlotTokenTradeReceipt.buyOrder = slotTokenBuyOrders[x];
        newSlotTokenTradeReceipt.sellOrder = newSlotTokenSellOrder;
        await slotTokenTradeReceiptRegistry.add(newSlotTokenTradeReceipt);
        hasFilledABuyOrder = true;
        
        tx.voyageSlot_Token.SlotCountBalance_TEU = tx.voyageSlot_Token.SlotCountBalance_TEU - tx.quantity;
        tx.voyageSlot_Token.tokensSold_TEU += tx.quantity;
        tx.voyageSlot_Token.valueSold  += newSlotTokenTradeReceipt.totalDue;
        await voyageSlotTokenRegistry.update(tx.voyageSlot_Token);
        
        let buyerToken = await voyageSlotTokenRegistry.get(slotTokenBuyOrders[x].buyerToken.$identifier);
        buyerToken.SlotCountBalance_TEU =  buyerToken.SlotCountBalance_TEU + tx.quantity;
        buyerToken.tokensBuying_TEU -= tx.quantity;
        buyerToken.tokensPurchased_TEU += tx.quantity;
        buyerToken.valuePurchased += newSlotTokenTradeReceipt.totalDue;
        await voyageSlotTokenRegistry.update(buyerToken);
        
        return ("Sell Order has sold " + noOfTokensBeingSold + "/" + noOfTokensBeingSold + " tokens, View Receipt in Tokens Sold");
        break;
      }
      if(slotTokenBuyOrders[x].containerSlotQuantity_TEU < tx.quantity){
        //new SellOrder can Cover the Buy Order with extra, will loop Buy Orders after
        
        let newSlotTokenSellOrder = factory.newResource('org.example.shipping', 'SlotTokenSellOrder', tx.nextID + '');
        newSlotTokenSellOrder.seller = tx.voyageSlot_Token.Owner;
        newSlotTokenSellOrder.sellerToken = tx.voyageSlot_Token;
        newSlotTokenSellOrder.sellPriceLimit = tx.sellPrice;
        newSlotTokenSellOrder.voyage = tx.voyageSlot_Token.voyage;
        newSlotTokenSellOrder.createdByUser = currentParticipant;
        newSlotTokenSellOrder.lastModifiedByUser = currentParticipant;
        newSlotTokenSellOrder.created = tx.timestamp;
        newSlotTokenSellOrder.lastModified = tx.timestamp;
        newSlotTokenSellOrder.status = "Forfilled";
        newSlotTokenSellOrder.containerSlotQuantity_TEU = slotTokenBuyOrders[x].containerSlotQuantity_TEU;
        await slotTokenSellOrderRegistry.add(newSlotTokenSellOrder);
        
        slotTokenBuyOrders[x].status = "Forfilled";
        await slotTokenBuyOrderRegistry.update(slotTokenBuyOrders[x]);
        
        let newSlotTokenTradeReceipt = factory.newResource('org.example.shipping', 'SlotTokenTradeReceipt', tx.nextID + '');
        newSlotTokenTradeReceipt.seller = tx.voyageSlot_Token.Owner;
        newSlotTokenTradeReceipt.buyer = slotTokenBuyOrders[x].buyer;
        newSlotTokenTradeReceipt.voyage = tx.voyageSlot_Token.voyage;
        newSlotTokenTradeReceipt.containerSlotQuantity_TEU = slotTokenBuyOrders[x].containerSlotQuantity_TEU;
        newSlotTokenTradeReceipt.sellMinPriceLimit = tx.sellPrice;
        newSlotTokenTradeReceipt.buyMaxPriceLimit = slotTokenBuyOrders[x].buyPriceLimit;
        newSlotTokenTradeReceipt.totalDue = slotTokenBuyOrders[x].containerSlotQuantity_TEU * tx.sellPrice;
        newSlotTokenTradeReceipt.isPaid = false;
        newSlotTokenTradeReceipt.created = tx.timestamp;
        newSlotTokenTradeReceipt.buyOrder = slotTokenBuyOrders[x];
        newSlotTokenTradeReceipt.sellOrder = newSlotTokenSellOrder;
        await slotTokenTradeReceiptRegistry.add(newSlotTokenTradeReceipt);
        
        tx.voyageSlot_Token.SlotCountBalance_TEU = tx.voyageSlot_Token.SlotCountBalance_TEU - slotTokenBuyOrders[x].containerSlotQuantity_TEU;
        tx.voyageSlot_Token.tokensSold_TEU += slotTokenBuyOrders[x].containerSlotQuantity_TEU;
        tx.voyageSlot_Token.valueSold  += newSlotTokenTradeReceipt.totalDue;
        await voyageSlotTokenRegistry.update(tx.voyageSlot_Token);   

        let buyerToken = await voyageSlotTokenRegistry.get(slotTokenBuyOrders[x].buyerToken.$identifier);
        buyerToken.SlotCountBalance_TEU =  buyerToken.SlotCountBalance_TEU + slotTokenBuyOrders[x].containerSlotQuantity_TEU;
        buyerToken.tokensBuying_TEU -=  slotTokenBuyOrders[x].containerSlotQuantity_TEU;
        buyerToken.tokensPurchased_TEU +=  slotTokenBuyOrders[x].containerSlotQuantity_TEU;
        buyerToken.valuePurchased += newSlotTokenTradeReceipt.totalDue;
        await voyageSlotTokenRegistry.update(buyerToken);
        // Set Remaining new Sell offer Quantity
        tx.quantity = tx.quantity - newSlotTokenSellOrder.containerSlotQuantity_TEU;
        
        hasFilledABuyOrder = false; // Will still need to create a Sell Order with the remainder if no further Buy Orders match.
        isOrderModifiedBySystem = true;
        tx.nextID++;
      }else{ 
        //new SellOrder can partially Cover the Buy Order, check if other sell order(s) can cover remainder
        let sellQuantityAtValidPrice = tx.quantity;
        for (let y = 0; y < slotTokenSellOrders.length; y++) {
          if(slotTokenBuyOrders[x].buyPriceLimit >= slotTokenSellOrders[y].sellPriceLimit){
          	sellQuantityAtValidPrice += slotTokenSellOrders[y].containerSlotQuantity_TEU;

          	if(slotTokenBuyOrders[x].containerSlotQuantity_TEU == sellQuantityAtValidPrice){
              // perfect match, these sell orders together forfill the buy order,
              // do the new Sell Order first
              let newSlotTokenSellOrder = factory.newResource('org.example.shipping', 'SlotTokenSellOrder', tx.nextID + '');
              newSlotTokenSellOrder.seller = tx.voyageSlot_Token.Owner;
              newSlotTokenSellOrder.sellerToken = tx.voyageSlot_Token;
              newSlotTokenSellOrder.sellPriceLimit = tx.sellPrice;
              newSlotTokenSellOrder.voyage = tx.voyageSlot_Token.voyage;
              newSlotTokenSellOrder.createdByUser = currentParticipant;
              newSlotTokenSellOrder.lastModifiedByUser = currentParticipant;
              newSlotTokenSellOrder.created = tx.timestamp;
              newSlotTokenSellOrder.lastModified = tx.timestamp;
              newSlotTokenSellOrder.status = "Forfilled";
              newSlotTokenSellOrder.containerSlotQuantity_TEU = tx.quantity;
              await slotTokenSellOrderRegistry.add(newSlotTokenSellOrder);
              
              slotTokenBuyOrders[x].status = "Forfilled";
              await slotTokenBuyOrderRegistry.update(slotTokenBuyOrders[x]);
              
              let newSlotTokenTradeReceipt = factory.newResource('org.example.shipping', 'SlotTokenTradeReceipt', tx.nextID + '');
              newSlotTokenTradeReceipt.seller = tx.voyageSlot_Token.Owner;
              newSlotTokenTradeReceipt.buyer = slotTokenBuyOrders[x].buyer;
              newSlotTokenTradeReceipt.voyage = tx.voyageSlot_Token.voyage;
              newSlotTokenTradeReceipt.containerSlotQuantity_TEU = tx.quantity;
              newSlotTokenTradeReceipt.sellMinPriceLimit = tx.sellPrice;
              newSlotTokenTradeReceipt.buyMaxPriceLimit = slotTokenBuyOrders[x].buyPriceLimit;
              newSlotTokenTradeReceipt.totalDue = tx.quantity * tx.sellPrice;
              newSlotTokenTradeReceipt.isPaid = false;
              newSlotTokenTradeReceipt.created = tx.timestamp;
              newSlotTokenTradeReceipt.buyOrder = slotTokenBuyOrders[x];
              newSlotTokenTradeReceipt.sellOrder = newSlotTokenSellOrder;
              await slotTokenTradeReceiptRegistry.add(newSlotTokenTradeReceipt);
              
              tx.voyageSlot_Token.SlotCountBalance_TEU = tx.voyageSlot_Token.SlotCountBalance_TEU - tx.quantity;
              tx.voyageSlot_Token.tokensSold_TEU += tx.quantity;
              tx.voyageSlot_Token.valueSold  += newSlotTokenTradeReceipt.totalDue;
              await voyageSlotTokenRegistry.update(tx.voyageSlot_Token);
              // Update Full amount now (Except value)
              let buyerToken = await voyageSlotTokenRegistry.get(slotTokenBuyOrders[x].buyerToken.$identifier);
              buyerToken.SlotCountBalance_TEU =  buyerToken.SlotCountBalance_TEU + slotTokenBuyOrders[x].containerSlotQuantity_TEU;
              buyerToken.tokensBuying_TEU -=  slotTokenBuyOrders[x].containerSlotQuantity_TEU;
              buyerToken.tokensPurchased_TEU +=  slotTokenBuyOrders[x].containerSlotQuantity_TEU;
              buyerToken.valuePurchased += newSlotTokenTradeReceipt.totalDue;
              
              hasFilledABuyOrder = true;
              tx.nextID++;
              tx.quantity = 0;
              
              for ( let y2 = 0; y2 <= y; y2++){ // go back to y = 0 and submit all those sell orders
                if(slotTokenBuyOrders[x].buyPriceLimit >= slotTokenSellOrders[y2].sellPriceLimit){
                  slotTokenSellOrders[y2].status = "Forfilled";
                  await slotTokenSellOrderRegistry.update(slotTokenSellOrders[y2]);

                  let newSlotTokenTradeReceiptRemainder = factory.newResource('org.example.shipping', 'SlotTokenTradeReceipt', tx.nextID + '');
                  newSlotTokenTradeReceiptRemainder.seller = slotTokenSellOrders[y2].seller;
                  newSlotTokenTradeReceiptRemainder.buyer = slotTokenBuyOrders[x].buyer;
                  newSlotTokenTradeReceiptRemainder.voyage = slotTokenSellOrders[y2].voyage;
                  newSlotTokenTradeReceiptRemainder.containerSlotQuantity_TEU = slotTokenSellOrders[y2].containerSlotQuantity_TEU;
                  newSlotTokenTradeReceiptRemainder.sellMinPriceLimit = slotTokenSellOrders[y2].sellPriceLimit;
                  newSlotTokenTradeReceiptRemainder.buyMaxPriceLimit = slotTokenBuyOrders[x].buyPriceLimit;
                  newSlotTokenTradeReceiptRemainder.totalDue = slotTokenSellOrders[y2].containerSlotQuantity_TEU * slotTokenSellOrders[y2].sellPriceLimit;
                  newSlotTokenTradeReceiptRemainder.isPaid = false;
                  newSlotTokenTradeReceiptRemainder.created = tx.timestamp;
                  newSlotTokenTradeReceiptRemainder.buyOrder = slotTokenBuyOrders[x];
                  newSlotTokenTradeReceiptRemainder.sellOrder = slotTokenSellOrders[y2];
                  await slotTokenTradeReceiptRegistry.add(newSlotTokenTradeReceiptRemainder);

                  // Update Buyer and seller Token Value
                  buyerToken.valuePurchased += newSlotTokenTradeReceiptRemainder.totalDue;
                  
                  let sellerToken = await voyageSlotTokenRegistry.get(slotTokenSellOrders[y2].sellerToken.$identifier);
                  sellerToken.tokensSold_TEU += newSlotTokenTradeReceiptRemainder.containerSlotQuantity_TEU;
                  sellerToken.tokensSelling_TEU -= newSlotTokenTradeReceiptRemainder.containerSlotQuantity_TEU;
                  sellerToken.valueSold += newSlotTokenTradeReceiptRemainder.totalDue;
                  await voyageSlotTokenRegistry.update(sellerToken);

                  hasFilledABuyOrder = true;
                  tx.nextID++;
                
                  if (y2 == y) {
                      // We are Done, Send result Message
                      await voyageSlotTokenRegistry.update(buyerToken);
                      return ("Sell Order has sold " + noOfTokensBeingSold + "/" + noOfTokensBeingSold + " tokens, View Receipt(s) in Tokens Sold");
                  }
                }
              }
             
            }else if(slotTokenBuyOrders[x].containerSlotQuantity_TEU < sellQuantityAtValidPrice){
              // Sell offers forfill buy offer except some of the last sell order. (Sell Orders up to and including SellOrders[y2]). This sell order must be split
              // Again begin by Finishing off whats left of the new Sell Order
              let newSlotTokenSellOrder = factory.newResource('org.example.shipping', 'SlotTokenSellOrder', tx.nextID + '');
              newSlotTokenSellOrder.seller = tx.voyageSlot_Token.Owner;
              newSlotTokenSellOrder.sellerToken = tx.voyageSlot_Token;
              newSlotTokenSellOrder.sellPriceLimit = tx.sellPrice;
              newSlotTokenSellOrder.voyage = tx.voyageSlot_Token.voyage;
              newSlotTokenSellOrder.createdByUser = currentParticipant;
              newSlotTokenSellOrder.lastModifiedByUser = currentParticipant;
              newSlotTokenSellOrder.created = tx.timestamp;
              newSlotTokenSellOrder.lastModified = tx.timestamp;
              newSlotTokenSellOrder.status = "Forfilled";
              newSlotTokenSellOrder.containerSlotQuantity_TEU = tx.quantity;
              await slotTokenSellOrderRegistry.add(newSlotTokenSellOrder);
              
              slotTokenBuyOrders[x].status = "Forfilled";
              await slotTokenBuyOrderRegistry.update(slotTokenBuyOrders[x]);
              
              let newSlotTokenTradeReceipt = factory.newResource('org.example.shipping', 'SlotTokenTradeReceipt', tx.nextID + '');
              newSlotTokenTradeReceipt.seller = tx.voyageSlot_Token.Owner;
              newSlotTokenTradeReceipt.buyer = slotTokenBuyOrders[x].buyer;
              newSlotTokenTradeReceipt.voyage = tx.voyageSlot_Token.voyage;
              newSlotTokenTradeReceipt.containerSlotQuantity_TEU = tx.quantity;
              newSlotTokenTradeReceipt.sellMinPriceLimit = tx.sellPrice;
              newSlotTokenTradeReceipt.buyMaxPriceLimit = slotTokenBuyOrders[x].buyPriceLimit;
              newSlotTokenTradeReceipt.totalDue = tx.quantity * tx.sellPrice;
              newSlotTokenTradeReceipt.isPaid = false;
              newSlotTokenTradeReceipt.created = tx.timestamp;
              newSlotTokenTradeReceipt.buyOrder = slotTokenBuyOrders[x];
              newSlotTokenTradeReceipt.sellOrder = newSlotTokenSellOrder;
              await slotTokenTradeReceiptRegistry.add(newSlotTokenTradeReceipt);
              hasFilledABuyOrder = true;
              tx.nextID++;
              
              tx.voyageSlot_Token.SlotCountBalance_TEU = tx.voyageSlot_Token.SlotCountBalance_TEU - tx.quantity;
              tx.voyageSlot_Token.tokensSold_TEU += tx.quantity;
              tx.voyageSlot_Token.valueSold  += newSlotTokenTradeReceipt.totalDue;
              await voyageSlotTokenRegistry.update(tx.voyageSlot_Token);
              // Update Full amount now (Except value)
              let buyerToken = await voyageSlotTokenRegistry.get(slotTokenBuyOrders[x].buyerToken.$identifier);
              buyerToken.SlotCountBalance_TEU =  buyerToken.SlotCountBalance_TEU + slotTokenBuyOrders[x].containerSlotQuantity_TEU;
              buyerToken.tokensBuying_TEU -=  slotTokenBuyOrders[x].containerSlotQuantity_TEU;
              buyerToken.tokensPurchased_TEU +=  slotTokenBuyOrders[x].containerSlotQuantity_TEU;
              buyerToken.valuePurchased += newSlotTokenTradeReceipt.totalDue;       

              let remainingTokensToBuyFromBuyOrder = slotTokenBuyOrders[x].containerSlotQuantity_TEU - tx.quantity;
              tx.quantity = 0;
              // Now that remainder of new Sell Order is sold, use up old sell orders up to y, with last sell order having a remainder
              for ( let y2 = 0; y2 <= y; y2++){
                if(slotTokenBuyOrders[x].buyPriceLimit >= slotTokenSellOrders[y2].sellPriceLimit){
                  if (y2 == y){
                   // If the last sell order, we must split it into a new sell order and sell some of it.
                    // sellQuantityAtValidPrice - slotTokenBuyOrders[x].containerSlotQuantity_TEU gives us the overshoot
                      let overShootSellOfferQuantity = sellQuantityAtValidPrice - slotTokenBuyOrders[x].containerSlotQuantity_TEU;
                    // First create the Overshoot sell offer
                      let newOverShootSlotTokenSellOrder = factory.newResource('org.example.shipping', 'SlotTokenSellOrder', tx.nextID + '');
                      newOverShootSlotTokenSellOrder.seller = slotTokenSellOrders[y2].seller;
                      newOverShootSlotTokenSellOrder.sellerToken = slotTokenSellOrders[y2].sellerToken;
                      newOverShootSlotTokenSellOrder.sellPriceLimit = slotTokenSellOrders[y2].sellPriceLimit;
                      newOverShootSlotTokenSellOrder.voyage = slotTokenSellOrders[y2].voyage;
                      newOverShootSlotTokenSellOrder.createdByUser = currentParticipant;// system
                     // newOverShootSlotTokenSellOrder.createdByUser = resource:org.example.shipping.CarrierEmployee#System
                      newOverShootSlotTokenSellOrder.lastModifiedByUser = systemUser; // system
                      newOverShootSlotTokenSellOrder.created = slotTokenSellOrders[y2].created;
                      newOverShootSlotTokenSellOrder.lastModified = tx.timestamp;
                      newOverShootSlotTokenSellOrder.status = "Pending";
                      newOverShootSlotTokenSellOrder.containerSlotQuantity_TEU = overShootSellOfferQuantity;
                      await slotTokenSellOrderRegistry.add(newOverShootSlotTokenSellOrder);
                    
                    // now deal with the rest of the original sell-order we split
                      let modifiedSellOfferQuantity =  slotTokenSellOrders[y2].containerSlotQuantity_TEU - overShootSellOfferQuantity ;
                      slotTokenSellOrders[y2].containerSlotQuantity_TEU = modifiedSellOfferQuantity;
                      slotTokenSellOrders[y2].lastModifiedByUser = systemUser; // system
                      slotTokenSellOrders[y2].lastModified = tx.timestamp;
                      slotTokenSellOrders[y2].status = "Forfilled";
                      await slotTokenSellOrderRegistry.update(slotTokenSellOrders[y2]);
                      
                      let newSlotTokenTradeReceiptRemainder = factory.newResource('org.example.shipping', 'SlotTokenTradeReceipt', tx.nextID + '');
                      newSlotTokenTradeReceiptRemainder.seller = slotTokenSellOrders[y2].seller;
                      newSlotTokenTradeReceiptRemainder.buyer = slotTokenBuyOrders[x].buyer;
                      newSlotTokenTradeReceiptRemainder.voyage = slotTokenSellOrders[y2].voyage;
                      newSlotTokenTradeReceiptRemainder.containerSlotQuantity_TEU = modifiedSellOfferQuantity;
                      newSlotTokenTradeReceiptRemainder.sellMinPriceLimit = slotTokenSellOrders[y2].sellPriceLimit;
                      newSlotTokenTradeReceiptRemainder.buyMaxPriceLimit = slotTokenBuyOrders[x].buyPriceLimit;
                      newSlotTokenTradeReceiptRemainder.totalDue = modifiedSellOfferQuantity * slotTokenSellOrders[y2].sellPriceLimit;
                      newSlotTokenTradeReceiptRemainder.isPaid = false;
                      newSlotTokenTradeReceiptRemainder.created = tx.timestamp;
                      newSlotTokenTradeReceiptRemainder.buyOrder = slotTokenBuyOrders[x];
                      newSlotTokenTradeReceiptRemainder.sellOrder = slotTokenSellOrders[y2];
                      await slotTokenTradeReceiptRegistry.add(newSlotTokenTradeReceiptRemainder);
                    
                      hasFilledABuyOrder = true;
                      tx.nextID++;

                      buyerToken.valuePurchased += newSlotTokenTradeReceiptRemainder.totalDue; 
                      await voyageSlotTokenRegistry.update(buyerToken);
                      
                      let sellerToken = await voyageSlotTokenRegistry.get(slotTokenSellOrders[y2].sellerToken.$identifier);
                      sellerToken.tokensSold_TEU += newSlotTokenTradeReceiptRemainder.containerSlotQuantity_TEU;
                      sellerToken.tokensSelling_TEU -= newSlotTokenTradeReceiptRemainder.containerSlotQuantity_TEU;
                      sellerToken.valueSold += newSlotTokenTradeReceiptRemainder.totalDue;
                      await voyageSlotTokenRegistry.update(sellerToken);

                      return ("Sell Order has sold " + noOfTokensBeingSold + "/" + noOfTokensBeingSold + " tokens, View Receipt(s) in Tokens Sold");
                    
                  }else{
                    // else sell the whole sell-order like normal
                  
                    slotTokenSellOrders[y2].status = "Forfilled";
                    await slotTokenSellOrderRegistry.update(slotTokenSellOrders[y2]);

                    let newSlotTokenTradeReceiptRemainder = factory.newResource('org.example.shipping', 'SlotTokenTradeReceipt', tx.nextID + '');
                    newSlotTokenTradeReceiptRemainder.seller = slotTokenSellOrders[y2].seller;
                    newSlotTokenTradeReceiptRemainder.buyer = slotTokenBuyOrders[x].buyer;
                    newSlotTokenTradeReceiptRemainder.voyage = slotTokenSellOrders[y2].voyage;
                    newSlotTokenTradeReceiptRemainder.containerSlotQuantity_TEU = slotTokenSellOrders[y2].containerSlotQuantity_TEU;
                    newSlotTokenTradeReceiptRemainder.sellMinPriceLimit = slotTokenSellOrders[y2].sellPriceLimit;
                    newSlotTokenTradeReceiptRemainder.buyMaxPriceLimit = slotTokenBuyOrders[x].buyPriceLimit;
                    newSlotTokenTradeReceiptRemainder.totalDue = slotTokenSellOrders[y2].containerSlotQuantity_TEU * slotTokenSellOrders[y2].sellPriceLimit;
                    newSlotTokenTradeReceiptRemainder.isPaid = false;
                    newSlotTokenTradeReceiptRemainder.created = tx.timestamp;
                    newSlotTokenTradeReceiptRemainder.buyOrder = slotTokenBuyOrders[x];
                    newSlotTokenTradeReceiptRemainder.sellOrder = slotTokenSellOrders[y2];
                    await slotTokenTradeReceiptRegistry.add(newSlotTokenTradeReceiptRemainder);
                    hasFilledABuyOrder = true;
                    tx.nextID++;

                    buyerToken.valuePurchased += newSlotTokenTradeReceiptRemainder.totalDue;
                  
                    let sellerToken = await voyageSlotTokenRegistry.get(slotTokenSellOrders[y2].sellerToken.$identifier);
                    sellerToken.tokensSold_TEU += newSlotTokenTradeReceiptRemainder.containerSlotQuantity_TEU;
                    sellerToken.tokensSelling_TEU -= newSlotTokenTradeReceiptRemainder.containerSlotQuantity_TEU;
                    sellerToken.valueSold += newSlotTokenTradeReceiptRemainder.totalDue;
                    await voyageSlotTokenRegistry.update(sellerToken);
                  }
                }
              }
            }

           
          }
        }
      }
      
    }
  }
  
if (!hasFilledABuyOrder){
        let newSlotTokenSellOrder = factory.newResource('org.example.shipping', 'SlotTokenSellOrder', tx.nextID + '');
        newSlotTokenSellOrder.seller = tx.voyageSlot_Token.Owner;
        newSlotTokenSellOrder.sellerToken = tx.voyageSlot_Token;
        newSlotTokenSellOrder.sellPriceLimit = tx.sellPrice;
        newSlotTokenSellOrder.voyage = tx.voyageSlot_Token.voyage;
  		if (isOrderModifiedBySystem){
          newSlotTokenSellOrder.createdByUser = currentParticipant; // system
          newSlotTokenSellOrder.lastModifiedByUser = systemUser;  // system
        }else{
          newSlotTokenSellOrder.createdByUser = currentParticipant;
          newSlotTokenSellOrder.lastModifiedByUser = currentParticipant; 
        }
        newSlotTokenSellOrder.created = tx.timestamp;
        newSlotTokenSellOrder.lastModified = tx.timestamp;
        newSlotTokenSellOrder.status = "Pending";
        newSlotTokenSellOrder.containerSlotQuantity_TEU = tx.quantity;
        await slotTokenSellOrderRegistry.add(newSlotTokenSellOrder);
  
        tx.voyageSlot_Token.SlotCountBalance_TEU = tx.voyageSlot_Token.SlotCountBalance_TEU - tx.quantity;
        tx.voyageSlot_Token.tokensSelling_TEU += tx.quantity;
        await voyageSlotTokenRegistry.update(tx.voyageSlot_Token);
  
  if ( tx.quantity == noOfTokensBeingSold){
    return ("Sell Order added");
  }else{
     let soldAmount = noOfTokensBeingSold - tx.quantity;
 	 return ("Sell Order has sold " + soldAmount + "/" + noOfTokensBeingSold + " tokens, View Receipt(s) in Tokens Sold");
  }
}
}

















/**
 * transaction processor function.
 * @param {org.example.shipping.VoyageToken_EditSellOrder} tx transaction instance.
 * @transaction
 */
async function voyageToken_EditSellOrder(tx) {  // eslint-disable-line no-unused-vars
  var factory = getFactory();
  var currentParticipant = getCurrentParticipant();
  const carrierEmployeeRegistary = await getParticipantRegistry('org.example.shipping.CarrierEmployee');
  const slotTokenTradeReceiptRegistry = await getAssetRegistry('org.example.shipping.SlotTokenTradeReceipt');
  const slotTokenSellOrderRegistry = await getAssetRegistry('org.example.shipping.SlotTokenSellOrder');  
  const slotTokenBuyOrderRegistry = await getAssetRegistry('org.example.shipping.SlotTokenBuyOrder');
  const voyageSlotTokenRegistry = await getAssetRegistry('org.example.shipping.VoyageSlot_Token');
  
  let slotTokenSellOrders = await query('getSlotTokenSellOrder_ForEdit', 
                                     { "voyage": tx.voyageSlot_Token.voyage.toURI(),
                                     "organisation":  tx.voyageSlot_Token.Owner.toURI(),
                                     "sellOrderID": tx.sellOrder.slotTokenSellOrderID });
  let slotTokenBuyOrders = await query('getSlotTokenBuyOrder_ForVoyage', 
                                     { "voyage": tx.voyageSlot_Token.voyage.toURI(),
                                     "organisation":  tx.voyageSlot_Token.Owner.toURI()});

  let systemUser = await carrierEmployeeRegistary.get("System");
  
  // Optimisation: If Voyage is the same, and quantity is reduced or price is raised, all else unchanged, there is no point searching buy orders
  if (tx.voyageSlot_Token.voyageSlot_TokenID == tx.sellOrder.sellerToken.voyageSlot_TokenID){
  	if(tx.quantity <= tx.sellOrder.containerSlotQuantity_TEU && tx.sellPrice >= tx.sellOrder.sellPriceLimit){
    	tx.sellOrder.containerSlotQuantity_TEU = tx.quantity;
    	tx.sellOrder.sellPriceLimit = tx.sellPrice;
      tx.sellOrder.lastModifiedByUser = currentParticipant;
     	tx.sellOrder.lastModified = tx.timestamp;
      await slotTokenSellOrderRegistry.update(tx.sellOrder);
      
      let tokensToRefund = tx.sellOrder.containerSlotQuantity_TEU - tx.quantity;
      tx.voyageSlot_Token.SlotCountBalance_TEU += tokensToRefund;
      tx.voyageSlot_Token.tokensSelling_TEU -= tokensToRefund;
      await voyageSlotTokenRegistry.update(tx.voyageSlot_Token);
      return("Sell Order Updated");
    }     
  }

if (tx.voyageSlot_Token.voyageSlot_TokenID != tx.sellOrder.sellerToken.voyageSlot_TokenID){
   //Voyage changed: Refund Tokens for old Voyage
  if (tx.quantity > tx.voyageSlot_Token.SlotCountBalance_TEU + 0.01){
		return("Error: Not enough Tokens to sell specified quantity");
	}
  tx.sellOrder.sellerToken.SlotCountBalance_TEU += tx.sellOrder.containerSlotQuantity_TEU;
  tx.sellOrder.sellerToken.tokensSelling_TEU -= tx.sellOrder.containerSlotQuantity_TEU;
	voyageSlotTokenRegistry.update(tx.sellOrder.sellerToken);
}else {
	// Same Voyage, Refund tokens for current voyage until new order is made
  tx.voyageSlot_Token.SlotCountBalance_TEU += tx.sellOrder.containerSlotQuantity_TEU;
  tx.voyageSlot_Token.tokensSelling_TEU -= tx.sellOrder.containerSlotQuantity_TEU;
	if (tx.sellOrder.sellerToken.SlotCountBalance_TEU - tx.quantity < 0){
		// Check if seller has enough tokens
		return("Error: Not enough Tokens to sell specified quantity");
	}
}
   
  await slotTokenSellOrderRegistry.remove(tx.sellOrder);
   
  let hasFilledABuyOrder = false;
  let isOrderModifiedBySystem = false;
  let noOfTokensBeingSold = tx.quantity;
  // Optimisation: If the new Sell Order does not satisfy any buy orders, Do not compare agaisnt existing Sell orders because no new buy orders will be satisfyed.
  // Search if any buy Orders Match
  for (let x = 0; x < slotTokenBuyOrders.length; x++) {
  	if(slotTokenBuyOrders[x].buyPriceLimit >= tx.sellPrice){
      if(slotTokenBuyOrders[x].containerSlotQuantity_TEU == tx.quantity){
        //stop new SellOrder Exactly forfills a BuyOrder
        //create recipt and Sell Order
        let newSlotTokenSellOrder = factory.newResource('org.example.shipping', 'SlotTokenSellOrder', tx.nextID + '');
        newSlotTokenSellOrder.seller = tx.voyageSlot_Token.Owner;
        newSlotTokenSellOrder.sellerToken = tx.voyageSlot_Token;
        newSlotTokenSellOrder.sellPriceLimit = tx.sellPrice;
        newSlotTokenSellOrder.voyage = tx.voyageSlot_Token.voyage;
        newSlotTokenSellOrder.createdByUser = tx.sellOrder.createdByUser;
        newSlotTokenSellOrder.lastModifiedByUser = currentParticipant;
        newSlotTokenSellOrder.created = tx.timestamp;
        newSlotTokenSellOrder.lastModified = tx.timestamp;
        newSlotTokenSellOrder.status = "Forfilled";
        newSlotTokenSellOrder.containerSlotQuantity_TEU = tx.quantity;
        await slotTokenSellOrderRegistry.add(newSlotTokenSellOrder);
        
        slotTokenBuyOrders[x].status = "Forfilled";
        await slotTokenBuyOrderRegistry.update(slotTokenBuyOrders[x]);
        
        let newSlotTokenTradeReceipt = factory.newResource('org.example.shipping', 'SlotTokenTradeReceipt', tx.nextID + '');
        newSlotTokenTradeReceipt.seller = tx.voyageSlot_Token.Owner;
        newSlotTokenTradeReceipt.buyer = slotTokenBuyOrders[x].buyer;
        newSlotTokenTradeReceipt.voyage = tx.voyageSlot_Token.voyage;
        newSlotTokenTradeReceipt.containerSlotQuantity_TEU = tx.quantity;
        newSlotTokenTradeReceipt.sellMinPriceLimit = tx.sellPrice;
        newSlotTokenTradeReceipt.buyMaxPriceLimit = slotTokenBuyOrders[x].buyPriceLimit;
        newSlotTokenTradeReceipt.totalDue = tx.quantity * tx.sellPrice;
        newSlotTokenTradeReceipt.isPaid = false;
        newSlotTokenTradeReceipt.created = tx.timestamp;
        newSlotTokenTradeReceipt.buyOrder = slotTokenBuyOrders[x];
        newSlotTokenTradeReceipt.sellOrder = newSlotTokenSellOrder;
        await slotTokenTradeReceiptRegistry.add(newSlotTokenTradeReceipt);
        hasFilledABuyOrder = true;
        
        tx.voyageSlot_Token.SlotCountBalance_TEU = tx.voyageSlot_Token.SlotCountBalance_TEU - tx.quantity;
        tx.voyageSlot_Token.tokensSold_TEU += tx.quantity;
        tx.voyageSlot_Token.valueSold  += newSlotTokenTradeReceipt.totalDue;
        await voyageSlotTokenRegistry.update(tx.voyageSlot_Token);
        
        let buyerToken = await voyageSlotTokenRegistry.get(slotTokenBuyOrders[x].buyerToken.$identifier);
        buyerToken.SlotCountBalance_TEU =  buyerToken.SlotCountBalance_TEU + tx.quantity;
        buyerToken.tokensBuying_TEU -= tx.quantity;
        buyerToken.tokensPurchased_TEU += tx.quantity;
        buyerToken.valuePurchased += newSlotTokenTradeReceipt.totalDue;
        await voyageSlotTokenRegistry.update(buyerToken);
        
        return ("Updated Sell Order has sold " + noOfTokensBeingSold + "/" + noOfTokensBeingSold + " tokens, View Receipt in Tokens Sold");
        break;
      }
      if(slotTokenBuyOrders[x].containerSlotQuantity_TEU < tx.quantity){
        //new SellOrder can Cover the Buy Order with extra, will loop Buy Orders after
        
        let newSlotTokenSellOrder = factory.newResource('org.example.shipping', 'SlotTokenSellOrder', tx.nextID + '');
        newSlotTokenSellOrder.seller = tx.voyageSlot_Token.Owner;
        newSlotTokenSellOrder.sellerToken = tx.voyageSlot_Token;
        newSlotTokenSellOrder.sellPriceLimit = tx.sellPrice;
        newSlotTokenSellOrder.voyage = tx.voyageSlot_Token.voyage;
        newSlotTokenSellOrder.createdByUser = tx.sellOrder.createdByUser;
        newSlotTokenSellOrder.lastModifiedByUser = currentParticipant;
        newSlotTokenSellOrder.created = tx.timestamp;
        newSlotTokenSellOrder.lastModified = tx.timestamp;
        newSlotTokenSellOrder.status = "Forfilled";
        newSlotTokenSellOrder.containerSlotQuantity_TEU = slotTokenBuyOrders[x].containerSlotQuantity_TEU;
        await slotTokenSellOrderRegistry.add(newSlotTokenSellOrder);
        
        slotTokenBuyOrders[x].status = "Forfilled";
        await slotTokenBuyOrderRegistry.update(slotTokenBuyOrders[x]);
        
        let newSlotTokenTradeReceipt = factory.newResource('org.example.shipping', 'SlotTokenTradeReceipt', tx.nextID + '');
        newSlotTokenTradeReceipt.seller = tx.voyageSlot_Token.Owner;
        newSlotTokenTradeReceipt.buyer = slotTokenBuyOrders[x].buyer;
        newSlotTokenTradeReceipt.voyage = tx.voyageSlot_Token.voyage;
        newSlotTokenTradeReceipt.containerSlotQuantity_TEU = slotTokenBuyOrders[x].containerSlotQuantity_TEU;
        newSlotTokenTradeReceipt.sellMinPriceLimit = tx.sellPrice;
        newSlotTokenTradeReceipt.buyMaxPriceLimit = slotTokenBuyOrders[x].buyPriceLimit;
        newSlotTokenTradeReceipt.totalDue = slotTokenBuyOrders[x].containerSlotQuantity_TEU * tx.sellPrice;
        newSlotTokenTradeReceipt.isPaid = false;
        newSlotTokenTradeReceipt.created = tx.timestamp;
        newSlotTokenTradeReceipt.buyOrder = slotTokenBuyOrders[x];
        newSlotTokenTradeReceipt.sellOrder = newSlotTokenSellOrder;
        await slotTokenTradeReceiptRegistry.add(newSlotTokenTradeReceipt);
        
        tx.voyageSlot_Token.SlotCountBalance_TEU = tx.voyageSlot_Token.SlotCountBalance_TEU - slotTokenBuyOrders[x].containerSlotQuantity_TEU;
        tx.voyageSlot_Token.tokensSold_TEU += slotTokenBuyOrders[x].containerSlotQuantity_TEU;
        tx.voyageSlot_Token.valueSold  += newSlotTokenTradeReceipt.totalDue;
        await voyageSlotTokenRegistry.update(tx.voyageSlot_Token);   

        let buyerToken = await voyageSlotTokenRegistry.get(slotTokenBuyOrders[x].buyerToken.$identifier);
        buyerToken.SlotCountBalance_TEU =  buyerToken.SlotCountBalance_TEU + slotTokenBuyOrders[x].containerSlotQuantity_TEU;
        buyerToken.tokensBuying_TEU -=  slotTokenBuyOrders[x].containerSlotQuantity_TEU;
        buyerToken.tokensPurchased_TEU +=  slotTokenBuyOrders[x].containerSlotQuantity_TEU;
        buyerToken.valuePurchased += newSlotTokenTradeReceipt.totalDue;
        await voyageSlotTokenRegistry.update(buyerToken);
        // Set Remaining new Sell offer Quantity
        tx.quantity = tx.quantity - newSlotTokenSellOrder.containerSlotQuantity_TEU;
        
        hasFilledABuyOrder = false; // Will still need to create a Sell Order with the remainder if no further Buy Orders match.
        isOrderModifiedBySystem = true;
        tx.nextID++;
      }else{ 
        //new SellOrder can partially Cover the Buy Order, check if other sell order(s) can cover remainder
        let sellQuantityAtValidPrice = tx.quantity;
        for (let y = 0; y < slotTokenSellOrders.length; y++) {
          if(slotTokenBuyOrders[x].buyPriceLimit >= slotTokenSellOrders[y].sellPriceLimit){
          	sellQuantityAtValidPrice += slotTokenSellOrders[y].containerSlotQuantity_TEU;

          	if(slotTokenBuyOrders[x].containerSlotQuantity_TEU == sellQuantityAtValidPrice){
              // perfect match, these sell orders together forfill the buy order,
              // do the new Sell Order first
              let newSlotTokenSellOrder = factory.newResource('org.example.shipping', 'SlotTokenSellOrder', tx.nextID + '');
              newSlotTokenSellOrder.seller = tx.voyageSlot_Token.Owner;
              newSlotTokenSellOrder.sellerToken = tx.voyageSlot_Token;
              newSlotTokenSellOrder.sellPriceLimit = tx.sellPrice;
              newSlotTokenSellOrder.voyage = tx.voyageSlot_Token.voyage;
              newSlotTokenSellOrder.createdByUser = tx.sellOrder.createdByUser;
              newSlotTokenSellOrder.lastModifiedByUser = currentParticipant;
              newSlotTokenSellOrder.created = tx.timestamp;
              newSlotTokenSellOrder.lastModified = tx.timestamp;
              newSlotTokenSellOrder.status = "Forfilled";
              newSlotTokenSellOrder.containerSlotQuantity_TEU = tx.quantity;
              await slotTokenSellOrderRegistry.add(newSlotTokenSellOrder);
              
              slotTokenBuyOrders[x].status = "Forfilled";
              await slotTokenBuyOrderRegistry.update(slotTokenBuyOrders[x]);
              
              let newSlotTokenTradeReceipt = factory.newResource('org.example.shipping', 'SlotTokenTradeReceipt', tx.nextID + '');
              newSlotTokenTradeReceipt.seller = tx.voyageSlot_Token.Owner;
              newSlotTokenTradeReceipt.buyer = slotTokenBuyOrders[x].buyer;
              newSlotTokenTradeReceipt.voyage = tx.voyageSlot_Token.voyage;
              newSlotTokenTradeReceipt.containerSlotQuantity_TEU = tx.quantity;
              newSlotTokenTradeReceipt.sellMinPriceLimit = tx.sellPrice;
              newSlotTokenTradeReceipt.buyMaxPriceLimit = slotTokenBuyOrders[x].buyPriceLimit;
              newSlotTokenTradeReceipt.totalDue = tx.quantity * tx.sellPrice;
              newSlotTokenTradeReceipt.isPaid = false;
              newSlotTokenTradeReceipt.created = tx.timestamp;
              newSlotTokenTradeReceipt.buyOrder = slotTokenBuyOrders[x];
              newSlotTokenTradeReceipt.sellOrder = newSlotTokenSellOrder;
              await slotTokenTradeReceiptRegistry.add(newSlotTokenTradeReceipt);
              
              tx.voyageSlot_Token.SlotCountBalance_TEU = tx.voyageSlot_Token.SlotCountBalance_TEU - tx.quantity;
              tx.voyageSlot_Token.tokensSold_TEU += tx.quantity;
              tx.voyageSlot_Token.valueSold  += newSlotTokenTradeReceipt.totalDue;
              await voyageSlotTokenRegistry.update(tx.voyageSlot_Token);
              // Update Full amount now (Except value)
              let buyerToken = await voyageSlotTokenRegistry.get(slotTokenBuyOrders[x].buyerToken.$identifier);
              buyerToken.SlotCountBalance_TEU =  buyerToken.SlotCountBalance_TEU + slotTokenBuyOrders[x].containerSlotQuantity_TEU;
              buyerToken.tokensBuying_TEU -=  slotTokenBuyOrders[x].containerSlotQuantity_TEU;
              buyerToken.tokensPurchased_TEU +=  slotTokenBuyOrders[x].containerSlotQuantity_TEU;
              buyerToken.valuePurchased += newSlotTokenTradeReceipt.totalDue;
              
              hasFilledABuyOrder = true;
              tx.nextID++;
              tx.quantity = 0;
              
              for ( let y2 = 0; y2 <= y; y2++){ // go back to y = 0 and submit all those sell orders
                if(slotTokenBuyOrders[x].buyPriceLimit >= slotTokenSellOrders[y2].sellPriceLimit){
                  slotTokenSellOrders[y2].status = "Forfilled";
                  await slotTokenSellOrderRegistry.update(slotTokenSellOrders[y2]);

                  let newSlotTokenTradeReceiptRemainder = factory.newResource('org.example.shipping', 'SlotTokenTradeReceipt', tx.nextID + '');
                  newSlotTokenTradeReceiptRemainder.seller = slotTokenSellOrders[y2].seller;
                  newSlotTokenTradeReceiptRemainder.buyer = slotTokenBuyOrders[x].buyer;
                  newSlotTokenTradeReceiptRemainder.voyage = slotTokenSellOrders[y2].voyage;
                  newSlotTokenTradeReceiptRemainder.containerSlotQuantity_TEU = slotTokenSellOrders[y2].containerSlotQuantity_TEU;
                  newSlotTokenTradeReceiptRemainder.sellMinPriceLimit = slotTokenSellOrders[y2].sellPriceLimit;
                  newSlotTokenTradeReceiptRemainder.buyMaxPriceLimit = slotTokenBuyOrders[x].buyPriceLimit;
                  newSlotTokenTradeReceiptRemainder.totalDue = slotTokenSellOrders[y2].containerSlotQuantity_TEU * slotTokenSellOrders[y2].sellPriceLimit;
                  newSlotTokenTradeReceiptRemainder.isPaid = false;
                  newSlotTokenTradeReceiptRemainder.created = tx.timestamp;
                  newSlotTokenTradeReceiptRemainder.buyOrder = slotTokenBuyOrders[x];
                  newSlotTokenTradeReceiptRemainder.sellOrder = slotTokenSellOrders[y2];
                  await slotTokenTradeReceiptRegistry.add(newSlotTokenTradeReceiptRemainder);
                
                  // Update Buyer and seller Token Value
                  buyerToken.valuePurchased += newSlotTokenTradeReceiptRemainder.totalDue;
                  
                  let sellerToken = await voyageSlotTokenRegistry.get(slotTokenSellOrders[y2].sellerToken.$identifier);
                  sellerToken.tokensSold_TEU += newSlotTokenTradeReceiptRemainder.containerSlotQuantity_TEU;
                  sellerToken.tokensSelling_TEU -= newSlotTokenTradeReceiptRemainder.containerSlotQuantity_TEU;
                  sellerToken.valueSold += newSlotTokenTradeReceiptRemainder.totalDue;
                  await voyageSlotTokenRegistry.update(sellerToken);

                  hasFilledABuyOrder = true;
                  tx.nextID++;
                
                  if (y2 == y) {
                      // We are Done, Send result Message
                      await voyageSlotTokenRegistry.update(buyerToken);
                      return ("Updated Sell Order has sold " + noOfTokensBeingSold + "/" + noOfTokensBeingSold + " tokens, View Receipt(s) in Tokens Sold");
                  }
                }
              }
             
            }else if(slotTokenBuyOrders[x].containerSlotQuantity_TEU < sellQuantityAtValidPrice){
              // Sell offers forfill buy offer except some of the last sell order. (Sell Orders up to and including SellOrders[y2]). This sell order must be split
              // Again begin by Finishing off whats left of the new Sell Order
              let newSlotTokenSellOrder = factory.newResource('org.example.shipping', 'SlotTokenSellOrder', tx.nextID + '');
              newSlotTokenSellOrder.seller = tx.voyageSlot_Token.Owner;
              newSlotTokenSellOrder.sellerToken = tx.voyageSlot_Token;
              newSlotTokenSellOrder.sellPriceLimit = tx.sellPrice;
              newSlotTokenSellOrder.voyage = tx.voyageSlot_Token.voyage;
              newSlotTokenSellOrder.createdByUser = tx.sellOrder.createdByUser;
              newSlotTokenSellOrder.lastModifiedByUser = currentParticipant;
              newSlotTokenSellOrder.created = tx.timestamp;
              newSlotTokenSellOrder.lastModified = tx.timestamp;
              newSlotTokenSellOrder.status = "Forfilled";
              newSlotTokenSellOrder.containerSlotQuantity_TEU = tx.quantity;
              await slotTokenSellOrderRegistry.add(newSlotTokenSellOrder);
              
              slotTokenBuyOrders[x].status = "Forfilled";
              await slotTokenBuyOrderRegistry.update(slotTokenBuyOrders[x]);
              
              let newSlotTokenTradeReceipt = factory.newResource('org.example.shipping', 'SlotTokenTradeReceipt', tx.nextID + '');
              newSlotTokenTradeReceipt.seller = tx.voyageSlot_Token.Owner;
              newSlotTokenTradeReceipt.buyer = slotTokenBuyOrders[x].buyer;
              newSlotTokenTradeReceipt.voyage = tx.voyageSlot_Token.voyage;
              newSlotTokenTradeReceipt.containerSlotQuantity_TEU = tx.quantity;
              newSlotTokenTradeReceipt.sellMinPriceLimit = tx.sellPrice;
              newSlotTokenTradeReceipt.buyMaxPriceLimit = slotTokenBuyOrders[x].buyPriceLimit;
              newSlotTokenTradeReceipt.totalDue = tx.quantity * tx.sellPrice;
              newSlotTokenTradeReceipt.isPaid = false;
              newSlotTokenTradeReceipt.created = tx.timestamp;
              newSlotTokenTradeReceipt.buyOrder = slotTokenBuyOrders[x];
              newSlotTokenTradeReceipt.sellOrder = newSlotTokenSellOrder;
              await slotTokenTradeReceiptRegistry.add(newSlotTokenTradeReceipt);
              hasFilledABuyOrder = true;
              tx.nextID++;
              
              tx.voyageSlot_Token.SlotCountBalance_TEU = tx.voyageSlot_Token.SlotCountBalance_TEU - tx.quantity;
              tx.voyageSlot_Token.tokensSold_TEU += tx.quantity;
              tx.voyageSlot_Token.valueSold  += newSlotTokenTradeReceipt.totalDue;
              await voyageSlotTokenRegistry.update(tx.voyageSlot_Token);
              // Update Full amount now (Except value)
              let buyerToken = await voyageSlotTokenRegistry.get(slotTokenBuyOrders[x].buyerToken.$identifier);
              buyerToken.SlotCountBalance_TEU =  buyerToken.SlotCountBalance_TEU + slotTokenBuyOrders[x].containerSlotQuantity_TEU;
              buyerToken.tokensBuying_TEU -=  slotTokenBuyOrders[x].containerSlotQuantity_TEU;
              buyerToken.tokensPurchased_TEU +=  slotTokenBuyOrders[x].containerSlotQuantity_TEU;
              buyerToken.valuePurchased += newSlotTokenTradeReceipt.totalDue;
              
              let remainingTokensToBuyFromBuyOrder = slotTokenBuyOrders[x].containerSlotQuantity_TEU - tx.quantity;
              tx.quantity = 0;
              // Now that remainder of new Sell Order is sold, use up old sell orders up to y, with last sell order having a remainder
              for ( let y2 = 0; y2 <= y; y2++){
                if(slotTokenBuyOrders[x].buyPriceLimit >= slotTokenSellOrders[y2].sellPriceLimit){
                  if (y2 == y){
                   // If the last sell order, we must split it into a new sell order and sell some of it.
                    // sellQuantityAtValidPrice - slotTokenBuyOrders[x].containerSlotQuantity_TEU gives us the overshoot
                      let overShootSellOfferQuantity = sellQuantityAtValidPrice - slotTokenBuyOrders[x].containerSlotQuantity_TEU;
                    // First create the Overshoot sell offer
                      let newOverShootSlotTokenSellOrder = factory.newResource('org.example.shipping', 'SlotTokenSellOrder', tx.nextID + '');
                      newOverShootSlotTokenSellOrder.seller = slotTokenSellOrders[y2].seller;
                      newOverShootSlotTokenSellOrder.sellerToken = slotTokenSellOrders[y2].sellerToken;
                      newOverShootSlotTokenSellOrder.sellPriceLimit = slotTokenSellOrders[y2].sellPriceLimit;
                      newOverShootSlotTokenSellOrder.voyage = slotTokenSellOrders[y2].voyage;
                      newOverShootSlotTokenSellOrder.createdByUser = currentParticipant;// system
                     // newOverShootSlotTokenSellOrder.createdByUser = resource:org.example.shipping.CarrierEmployee#System
                      newOverShootSlotTokenSellOrder.lastModifiedByUser = systemUser; // system
                      newOverShootSlotTokenSellOrder.created = slotTokenSellOrders[y2].created;
                      newOverShootSlotTokenSellOrder.lastModified = tx.timestamp;
                      newOverShootSlotTokenSellOrder.status = "Pending";
                      newOverShootSlotTokenSellOrder.containerSlotQuantity_TEU = overShootSellOfferQuantity;
                      await slotTokenSellOrderRegistry.add(newOverShootSlotTokenSellOrder);
                    
                    // now deal with the rest of the original sell-order we split
                      let modifiedSellOfferQuantity =  slotTokenSellOrders[y2].containerSlotQuantity_TEU - overShootSellOfferQuantity ;
                      slotTokenSellOrders[y2].containerSlotQuantity_TEU = modifiedSellOfferQuantity;
                      slotTokenSellOrders[y2].lastModifiedByUser = systemUser; // system
                      slotTokenSellOrders[y2].lastModified = tx.timestamp;
                      slotTokenSellOrders[y2].status = "Forfilled";
                      await slotTokenSellOrderRegistry.update(slotTokenSellOrders[y2]);
                      
                      let newSlotTokenTradeReceiptRemainder = factory.newResource('org.example.shipping', 'SlotTokenTradeReceipt', tx.nextID + '');
                      newSlotTokenTradeReceiptRemainder.seller = slotTokenSellOrders[y2].seller;
                      newSlotTokenTradeReceiptRemainder.buyer = slotTokenBuyOrders[x].buyer;
                      newSlotTokenTradeReceiptRemainder.voyage = slotTokenSellOrders[y2].voyage;
                      newSlotTokenTradeReceiptRemainder.containerSlotQuantity_TEU = modifiedSellOfferQuantity;
                      newSlotTokenTradeReceiptRemainder.sellMinPriceLimit = slotTokenSellOrders[y2].sellPriceLimit;
                      newSlotTokenTradeReceiptRemainder.buyMaxPriceLimit = slotTokenBuyOrders[x].buyPriceLimit;
                      newSlotTokenTradeReceiptRemainder.totalDue = modifiedSellOfferQuantity * slotTokenSellOrders[y2].sellPriceLimit;
                      newSlotTokenTradeReceiptRemainder.isPaid = false;
                      newSlotTokenTradeReceiptRemainder.created = tx.timestamp;
                      newSlotTokenTradeReceiptRemainder.buyOrder = slotTokenBuyOrders[x];
                      newSlotTokenTradeReceiptRemainder.sellOrder = slotTokenSellOrders[y2];
                      await slotTokenTradeReceiptRegistry.add(newSlotTokenTradeReceiptRemainder);
                    
                      hasFilledABuyOrder = true;
                      tx.nextID++;
                    
                      buyerToken.valuePurchased += newSlotTokenTradeReceiptRemainder.totalDue; 
                      await voyageSlotTokenRegistry.update(buyerToken);
                      
                      let sellerToken = await voyageSlotTokenRegistry.get(slotTokenSellOrders[y2].sellerToken.$identifier);
                      sellerToken.tokensSold_TEU += newSlotTokenTradeReceiptRemainder.containerSlotQuantity_TEU;
                      sellerToken.tokensSelling_TEU -= newSlotTokenTradeReceiptRemainder.containerSlotQuantity_TEU;
                      sellerToken.valueSold += newSlotTokenTradeReceiptRemainder.totalDue;
                      await voyageSlotTokenRegistry.update(sellerToken);

                      return ("Updated Sell Order has sold " + noOfTokensBeingSold + "/" + noOfTokensBeingSold + " tokens, View Receipt(s) in Tokens Sold");
                    
                  }else{
                    // else sell the whole sell-order like normal
                  
                    slotTokenSellOrders[y2].status = "Forfilled";
                    await slotTokenSellOrderRegistry.update(slotTokenSellOrders[y2]);

                    let newSlotTokenTradeReceiptRemainder = factory.newResource('org.example.shipping', 'SlotTokenTradeReceipt', tx.nextID + '');
                    newSlotTokenTradeReceiptRemainder.seller = slotTokenSellOrders[y2].seller;
                    newSlotTokenTradeReceiptRemainder.buyer = slotTokenBuyOrders[x].buyer;
                    newSlotTokenTradeReceiptRemainder.voyage = slotTokenSellOrders[y2].voyage;
                    newSlotTokenTradeReceiptRemainder.containerSlotQuantity_TEU = slotTokenSellOrders[y2].containerSlotQuantity_TEU;
                    newSlotTokenTradeReceiptRemainder.sellMinPriceLimit = slotTokenSellOrders[y2].sellPriceLimit;
                    newSlotTokenTradeReceiptRemainder.buyMaxPriceLimit = slotTokenBuyOrders[x].buyPriceLimit;
                    newSlotTokenTradeReceiptRemainder.totalDue = slotTokenSellOrders[y2].containerSlotQuantity_TEU * slotTokenSellOrders[y2].sellPriceLimit;
                    newSlotTokenTradeReceiptRemainder.isPaid = false;
                    newSlotTokenTradeReceiptRemainder.created = tx.timestamp;
                    newSlotTokenTradeReceiptRemainder.buyOrder = slotTokenBuyOrders[x];
                    newSlotTokenTradeReceiptRemainder.sellOrder = slotTokenSellOrders[y2];
                    await slotTokenTradeReceiptRegistry.add(newSlotTokenTradeReceiptRemainder);
                    hasFilledABuyOrder = true;
                    tx.nextID++;

                    buyerToken.valuePurchased += newSlotTokenTradeReceiptRemainder.totalDue;
                  
                    let sellerToken = await voyageSlotTokenRegistry.get(slotTokenSellOrders[y2].sellerToken.$identifier);
                    sellerToken.tokensSold_TEU += newSlotTokenTradeReceiptRemainder.containerSlotQuantity_TEU;
                    sellerToken.tokensSelling_TEU -= newSlotTokenTradeReceiptRemainder.containerSlotQuantity_TEU;
                    sellerToken.valueSold += newSlotTokenTradeReceiptRemainder.totalDue;
                    await voyageSlotTokenRegistry.update(sellerToken);
                  }
                }
              }
            }

           
          }
        }
      }
      
    }
  }
  
if (!hasFilledABuyOrder){
        let newSlotTokenSellOrder = factory.newResource('org.example.shipping', 'SlotTokenSellOrder', tx.nextID + '');
        newSlotTokenSellOrder.seller = tx.voyageSlot_Token.Owner;
        newSlotTokenSellOrder.sellerToken = tx.voyageSlot_Token;
        newSlotTokenSellOrder.sellPriceLimit = tx.sellPrice;
        newSlotTokenSellOrder.voyage = tx.voyageSlot_Token.voyage;
  		if (isOrderModifiedBySystem){
          newSlotTokenSellOrder.createdByUser = currentParticipant; // system
          newSlotTokenSellOrder.lastModifiedByUser = systemUser;  // system
        }else{
          newSlotTokenSellOrder.createdByUser = tx.sellOrder.createdByUser;
          newSlotTokenSellOrder.lastModifiedByUser = currentParticipant; 
        }
        newSlotTokenSellOrder.created = tx.timestamp;
        newSlotTokenSellOrder.lastModified = tx.timestamp;
        newSlotTokenSellOrder.status = "Pending";
        newSlotTokenSellOrder.containerSlotQuantity_TEU = tx.quantity;
        await slotTokenSellOrderRegistry.add(newSlotTokenSellOrder);
  
        tx.voyageSlot_Token.SlotCountBalance_TEU = tx.voyageSlot_Token.SlotCountBalance_TEU - tx.quantity;
        tx.voyageSlot_Token.tokensSelling_TEU += tx.quantity;
        await voyageSlotTokenRegistry.update(tx.voyageSlot_Token);
  
  if ( tx.quantity == noOfTokensBeingSold){
    return ("Sell Order Updated");
  }else{
     let soldAmount = noOfTokensBeingSold - tx.quantity;
 	 return ("Updated Sell Order has sold " + soldAmount + "/" + noOfTokensBeingSold + " tokens, View Receipt(s) in Tokens Sold");
  }
} 
}



/**
 * Transaction processor function.
 * @param {org.example.shipping.VoyageToken_PlaceBuyOrder} tx The transaction instance.
 * @transaction
 */
async function voyageToken_PlaceBuyOrder(tx) {
	var factory = getFactory();
	var currentParticipant = getCurrentParticipant();
	const carrierEmployeeRegistary = await getParticipantRegistry('org.example.shipping.CarrierEmployee');
	const slotTokenTradeReceiptRegistry = await getAssetRegistry('org.example.shipping.SlotTokenTradeReceipt');
	const slotTokenSellOrderRegistry = await getAssetRegistry('org.example.shipping.SlotTokenSellOrder');
	const slotTokenBuyOrderRegistry = await getAssetRegistry('org.example.shipping.SlotTokenBuyOrder');
	const voyageSlotTokenRegistry = await getAssetRegistry('org.example.shipping.VoyageSlot_Token');

	let systemUser = await carrierEmployeeRegistary.get("System");
	let noOfTokensBeingSold = tx.quantity;

	let slotTokenSellOrders = await query('getSlotTokenSellOrder_WithMaxPrice',
		{
			"voyage": tx.voyageSlot_Token.voyage.toURI(),
			"organisation": tx.voyageSlot_Token.Owner.toURI(),
			"maxPrice": tx.buyPrice
		});

	// Much simpiler than Creating a Sell Order : Just loops Sell order(s)

	for (let x = 0; x < slotTokenSellOrders.length; x++) {
		if (slotTokenSellOrders[x].containerSlotQuantity_TEU == tx.quantity) {
			// Stop: new BuyOrder Exactly forfills a sell Order
			// create recipt and buy Order
			let newSlotTokenBuyOrder = factory.newResource('org.example.shipping', 'SlotTokenBuyOrder', tx.nextID + '');
			newSlotTokenBuyOrder.buyer = tx.voyageSlot_Token.Owner;
			newSlotTokenBuyOrder.buyerToken = tx.voyageSlot_Token;
			newSlotTokenBuyOrder.buyPriceLimit = tx.buyPrice;
			newSlotTokenBuyOrder.voyage = tx.voyageSlot_Token.voyage;
			newSlotTokenBuyOrder.createdByUser = currentParticipant;
			newSlotTokenBuyOrder.lastModifiedByUser = currentParticipant;
			newSlotTokenBuyOrder.created = tx.timestamp;
			newSlotTokenBuyOrder.lastModified = tx.timestamp;
			newSlotTokenBuyOrder.status = "Forfilled";
			newSlotTokenBuyOrder.containerSlotQuantity_TEU = tx.quantity;
			await slotTokenBuyOrderRegistry.add(newSlotTokenBuyOrder);

			slotTokenSellOrders[x].status = "Forfilled";
			await slotTokenSellOrderRegistry.update(slotTokenSellOrders[x]);

			let newSlotTokenTradeReceipt = factory.newResource('org.example.shipping', 'SlotTokenTradeReceipt', tx.nextID + '');
			newSlotTokenTradeReceipt.seller = slotTokenSellOrders[x].seller;
			newSlotTokenTradeReceipt.buyer = tx.voyageSlot_Token.Owner;
			newSlotTokenTradeReceipt.voyage = tx.voyageSlot_Token.voyage;
			newSlotTokenTradeReceipt.containerSlotQuantity_TEU = tx.quantity;
			newSlotTokenTradeReceipt.sellMinPriceLimit = slotTokenSellOrders[x].sellPriceLimit;
			newSlotTokenTradeReceipt.buyMaxPriceLimit = tx.buyPrice;
			newSlotTokenTradeReceipt.totalDue = tx.quantity * slotTokenSellOrders[x].sellPriceLimit;
			newSlotTokenTradeReceipt.isPaid = false;
			newSlotTokenTradeReceipt.created = tx.timestamp;
			newSlotTokenTradeReceipt.buyOrder = newSlotTokenBuyOrder;
			newSlotTokenTradeReceipt.sellOrder = slotTokenSellOrders[x];
			await slotTokenTradeReceiptRegistry.add(newSlotTokenTradeReceipt);

      tx.voyageSlot_Token.SlotCountBalance_TEU = tx.voyageSlot_Token.SlotCountBalance_TEU + tx.quantity;
      tx.voyageSlot_Token.tokensPurchased_TEU += newSlotTokenTradeReceipt.containerSlotQuantity_TEU;
      tx.voyageSlot_Token.valuePurchased += newSlotTokenTradeReceipt.totalDue;
      await voyageSlotTokenRegistry.update(tx.voyageSlot_Token);
      
      let sellerToken = await voyageSlotTokenRegistry.get(slotTokenSellOrders[x].sellerToken.$identifier);
      sellerToken.tokensSelling_TEU  -= newSlotTokenTradeReceipt.containerSlotQuantity_TEU;
      sellerToken.tokensSold_TEU  += newSlotTokenTradeReceipt.containerSlotQuantity_TEU;
      sellerToken.valueSold  += newSlotTokenTradeReceipt.totalDue;
      await voyageSlotTokenRegistry.update(sellerToken);

			return ("Buy Order of " + noOfTokensBeingSold + "tokens has been Forfilled, View Receipt in Tokens Bought");
			break;
		} else if (slotTokenSellOrders[x].containerSlotQuantity_TEU > tx.quantity) {
			//a SellOrder can Cover the new Buy Order with extra, will split Sell Order

			let newSlotTokenBuyOrder = factory.newResource('org.example.shipping', 'SlotTokenBuyOrder', tx.nextID + '');
			newSlotTokenBuyOrder.buyer = tx.voyageSlot_Token.Owner;
			newSlotTokenBuyOrder.buyerToken = tx.voyageSlot_Token;
			newSlotTokenBuyOrder.buyPriceLimit = tx.buyPrice;
			newSlotTokenBuyOrder.voyage = tx.voyageSlot_Token.voyage;
			newSlotTokenBuyOrder.createdByUser = currentParticipant;
			newSlotTokenBuyOrder.lastModifiedByUser = currentParticipant;
			newSlotTokenBuyOrder.created = tx.timestamp;
			newSlotTokenBuyOrder.lastModified = tx.timestamp;
			newSlotTokenBuyOrder.status = "Forfilled";
			newSlotTokenBuyOrder.containerSlotQuantity_TEU = tx.quantity;
			await slotTokenBuyOrderRegistry.add(newSlotTokenBuyOrder);
			// Sold portion of the Sell Order
			let newSlotTokenSellOrder = factory.newResource('org.example.shipping', 'SlotTokenSellOrder', tx.nextID + '');
			newSlotTokenSellOrder.seller = slotTokenSellOrders[x].seller;
			newSlotTokenSellOrder.sellerToken = slotTokenSellOrders[x].sellerToken;
			newSlotTokenSellOrder.sellPriceLimit = slotTokenSellOrders[x].sellPriceLimit;
			newSlotTokenSellOrder.voyage = slotTokenSellOrders[x].voyage;
			newSlotTokenSellOrder.createdByUser = slotTokenSellOrders[x].createdByUser;
			newSlotTokenSellOrder.lastModifiedByUser = systemUser; // System
			newSlotTokenSellOrder.created = slotTokenSellOrders[x].created;
			newSlotTokenSellOrder.lastModified = tx.timestamp;
			newSlotTokenSellOrder.status = "Forfilled";
			newSlotTokenSellOrder.containerSlotQuantity_TEU = tx.quantity;
			await slotTokenSellOrderRegistry.add(newSlotTokenSellOrder);
			// Remainder of Sell order
			slotTokenSellOrders[x].lastModifiedByUser = systemUser; // System
			slotTokenSellOrders[x].lastModified = tx.timestamp;
			slotTokenSellOrders[x].containerSlotQuantity_TEU = slotTokenSellOrders[x].containerSlotQuantity_TEU - tx.quantity;
			await slotTokenSellOrderRegistry.update(slotTokenSellOrders[x]);

			let newSlotTokenTradeReceipt = factory.newResource('org.example.shipping', 'SlotTokenTradeReceipt', tx.nextID + '');
			newSlotTokenTradeReceipt.seller = slotTokenSellOrders[x].seller;
			newSlotTokenTradeReceipt.buyer = tx.voyageSlot_Token.Owner;
			newSlotTokenTradeReceipt.voyage = tx.voyageSlot_Token.voyage;
			newSlotTokenTradeReceipt.containerSlotQuantity_TEU = tx.quantity;
			newSlotTokenTradeReceipt.sellMinPriceLimit = slotTokenSellOrders[x].sellPriceLimit;
			newSlotTokenTradeReceipt.buyMaxPriceLimit = tx.buyPrice;
			newSlotTokenTradeReceipt.totalDue = tx.quantity * slotTokenSellOrders[x].sellPriceLimit;
			newSlotTokenTradeReceipt.isPaid = false;
			newSlotTokenTradeReceipt.created = tx.timestamp;
			newSlotTokenTradeReceipt.buyOrder = newSlotTokenBuyOrder;
			newSlotTokenTradeReceipt.sellOrder = newSlotTokenSellOrder;
			await slotTokenTradeReceiptRegistry.add(newSlotTokenTradeReceipt);
      
      tx.voyageSlot_Token.SlotCountBalance_TEU = tx.voyageSlot_Token.SlotCountBalance_TEU + tx.quantity;
      tx.voyageSlot_Token.tokensPurchased_TEU += newSlotTokenTradeReceipt.containerSlotQuantity_TEU;
      tx.voyageSlot_Token.valuePurchased += newSlotTokenTradeReceipt.totalDue;
      await voyageSlotTokenRegistry.update(tx.voyageSlot_Token);
      
      let sellerToken = await voyageSlotTokenRegistry.get(slotTokenSellOrders[x].sellerToken.$identifier);
      sellerToken.tokensSelling_TEU  -= newSlotTokenTradeReceipt.containerSlotQuantity_TEU;
      sellerToken.tokensSold_TEU  += newSlotTokenTradeReceipt.containerSlotQuantity_TEU;
      sellerToken.valueSold  += newSlotTokenTradeReceipt.totalDue;
      await voyageSlotTokenRegistry.update(sellerToken);

			return ("Buy Order of " + noOfTokensBeingSold + "tokens has been Forfilled, View Receipt in Tokens Bought");
		} else {   // slotTokenSellOrders[x].containerSlotQuantity_TEU < tx.quantity
			// a Sell order partially forfills the new Buy order,
			// Loop through all sell orders to see if we can forfill the buy order

			let sellQuantityAtValidPrice = 0;
			for (let x2 = x; x2 < slotTokenSellOrders.length; x2++) {
				sellQuantityAtValidPrice += slotTokenSellOrders[x2].containerSlotQuantity_TEU;
				if (sellQuantityAtValidPrice >= tx.quantity) {
					// We have Enough sell Orders to complete Buy order
					// Create the Buy Order First
					let newSlotTokenBuyOrder = factory.newResource('org.example.shipping', 'SlotTokenBuyOrder', tx.nextID + '');
					newSlotTokenBuyOrder.buyer = tx.voyageSlot_Token.Owner;
					newSlotTokenBuyOrder.buyerToken = tx.voyageSlot_Token;
					newSlotTokenBuyOrder.buyPriceLimit = tx.buyPrice;
					newSlotTokenBuyOrder.voyage = tx.voyageSlot_Token.voyage;
					newSlotTokenBuyOrder.createdByUser = currentParticipant;
					newSlotTokenBuyOrder.lastModifiedByUser = currentParticipant;
					newSlotTokenBuyOrder.created = tx.timestamp;
					newSlotTokenBuyOrder.lastModified = tx.timestamp;
					newSlotTokenBuyOrder.status = "Forfilled";
					newSlotTokenBuyOrder.containerSlotQuantity_TEU = tx.quantity;
					await slotTokenBuyOrderRegistry.add(newSlotTokenBuyOrder);

          tx.voyageSlot_Token.SlotCountBalance_TEU = tx.voyageSlot_Token.SlotCountBalance_TEU + tx.quantity;
          tx.voyageSlot_Token.tokensPurchased_TEU += tx.quantity;
          
					// Then Loop through Sell orders and Create receipts
					let leftoverTokensFromLastSellOffer = sellQuantityAtValidPrice - tx.quantity;
					for (let x3 = x; x3 <= x2; x3++){
						if (x3 == x2) {
							// If last Sell Offer 
							if (leftoverTokensFromLastSellOffer > 0){
							  //if there are excess tokens, Split the Sell Order
								// Sold portion of the Sell Order
								let tokensSoldFromFinalSellOrder = slotTokenSellOrders[x3].containerSlotQuantity_TEU - leftoverTokensFromLastSellOffer;
								let newSlotTokenSellOrder = factory.newResource('org.example.shipping', 'SlotTokenSellOrder', tx.nextID + '');
								newSlotTokenSellOrder.seller = slotTokenSellOrders[x3].seller;
								newSlotTokenSellOrder.sellerToken = slotTokenSellOrders[x3].sellerToken;
								newSlotTokenSellOrder.sellPriceLimit = slotTokenSellOrders[x3].sellPriceLimit;
								newSlotTokenSellOrder.voyage = slotTokenSellOrders[x3].voyage;
								newSlotTokenSellOrder.createdByUser = slotTokenSellOrders[x3].createdByUser;
								newSlotTokenSellOrder.lastModifiedByUser = systemUser; // System
								newSlotTokenSellOrder.created = slotTokenSellOrders[x3].created;
								newSlotTokenSellOrder.lastModified = tx.timestamp;
								newSlotTokenSellOrder.status = "Forfilled";
								newSlotTokenSellOrder.containerSlotQuantity_TEU = tokensSoldFromFinalSellOrder;
								await slotTokenSellOrderRegistry.add(newSlotTokenSellOrder);

								let newSlotTokenTradeReceipt = factory.newResource('org.example.shipping', 'SlotTokenTradeReceipt', tx.nextID + '');
								newSlotTokenTradeReceipt.seller = slotTokenSellOrders[x3].seller;
								newSlotTokenTradeReceipt.buyer = tx.voyageSlot_Token.Owner;
								newSlotTokenTradeReceipt.voyage = tx.voyageSlot_Token.voyage;
								newSlotTokenTradeReceipt.containerSlotQuantity_TEU = tokensSoldFromFinalSellOrder;
								newSlotTokenTradeReceipt.sellMinPriceLimit = slotTokenSellOrders[x3].sellPriceLimit;
								newSlotTokenTradeReceipt.buyMaxPriceLimit = tx.buyPrice;
								newSlotTokenTradeReceipt.totalDue = tokensSoldFromFinalSellOrder * slotTokenSellOrders[x3].sellPriceLimit;
								newSlotTokenTradeReceipt.isPaid = false;
								newSlotTokenTradeReceipt.created = tx.timestamp;
								newSlotTokenTradeReceipt.buyOrder = newSlotTokenBuyOrder;
								newSlotTokenTradeReceipt.sellOrder = newSlotTokenSellOrder;
								await slotTokenTradeReceiptRegistry.add(newSlotTokenTradeReceipt);

								// Remainder of Sell order
								slotTokenSellOrders[x3].lastModifiedByUser = systemUser; // System
								slotTokenSellOrders[x3].lastModified = tx.timestamp;
								slotTokenSellOrders[x3].containerSlotQuantity_TEU = leftoverTokensFromLastSellOffer;
                await slotTokenSellOrderRegistry.update(slotTokenSellOrders[x3]);	
                
                tx.voyageSlot_Token.valuePurchased += newSlotTokenTradeReceipt.totalDue;
                await voyageSlotTokenRegistry.update(tx.voyageSlot_Token);

                let sellerToken = await voyageSlotTokenRegistry.get(slotTokenSellOrders[x3].sellerToken.$identifier);
                sellerToken.tokensSelling_TEU  -= newSlotTokenTradeReceipt.containerSlotQuantity_TEU;
                sellerToken.tokensSold_TEU  += newSlotTokenTradeReceipt.containerSlotQuantity_TEU;
                sellerToken.valueSold  += newSlotTokenTradeReceipt.totalDue;
                await voyageSlotTokenRegistry.update(sellerToken);

								return ("Buy Order of " + noOfTokensBeingSold + "tokens has been Forfilled by multiple Sell Orders, View Receipts in Tokens Bought");							
							
							}else{
								// No leftover Tokens, Finish Last sale Order and Exit
								slotTokenSellOrders[x3].status = "Forfilled";
								await slotTokenSellOrderRegistry.update(slotTokenSellOrders[x3]);
	
								let newSlotTokenTradeReceipt = factory.newResource('org.example.shipping', 'SlotTokenTradeReceipt', tx.nextID + '');
								newSlotTokenTradeReceipt.seller = slotTokenSellOrders[x3].seller;
								newSlotTokenTradeReceipt.buyer = tx.voyageSlot_Token.Owner;
								newSlotTokenTradeReceipt.voyage = tx.voyageSlot_Token.voyage;
								newSlotTokenTradeReceipt.containerSlotQuantity_TEU = slotTokenSellOrders[x3].containerSlotQuantity_TEU;
								newSlotTokenTradeReceipt.sellMinPriceLimit = slotTokenSellOrders[x3].sellPriceLimit;
								newSlotTokenTradeReceipt.buyMaxPriceLimit = tx.buyPrice;
								newSlotTokenTradeReceipt.totalDue = slotTokenSellOrders[x3].containerSlotQuantity_TEU * slotTokenSellOrders[x3].sellPriceLimit;
								newSlotTokenTradeReceipt.isPaid = false;
								newSlotTokenTradeReceipt.created = tx.timestamp;
								newSlotTokenTradeReceipt.buyOrder = newSlotTokenBuyOrder;
								newSlotTokenTradeReceipt.sellOrder = slotTokenSellOrders[x3];
                await slotTokenTradeReceiptRegistry.add(newSlotTokenTradeReceipt);
                
                tx.voyageSlot_Token.valuePurchased += newSlotTokenTradeReceipt.totalDue;
                await voyageSlotTokenRegistry.update(tx.voyageSlot_Token);

                let sellerToken = await voyageSlotTokenRegistry.get(slotTokenSellOrders[x3].sellerToken.$identifier);
                sellerToken.tokensSelling_TEU  -= newSlotTokenTradeReceipt.containerSlotQuantity_TEU;
                sellerToken.tokensSold_TEU  += newSlotTokenTradeReceipt.containerSlotQuantity_TEU;
                sellerToken.valueSold  += newSlotTokenTradeReceipt.totalDue;
                await voyageSlotTokenRegistry.update(sellerToken);

								return ("Buy Order of " + noOfTokensBeingSold + "tokens has been Forfilled by multiple Sell Orders, View Receipts in Tokens Bought");
							}
						}else{
							// Not the last Sell Order, create recipt as normal
							slotTokenSellOrders[x3].status = "Forfilled";
							await slotTokenSellOrderRegistry.update(slotTokenSellOrders[x3]);

							let newSlotTokenTradeReceipt = factory.newResource('org.example.shipping', 'SlotTokenTradeReceipt', tx.nextID + '');
							newSlotTokenTradeReceipt.seller = slotTokenSellOrders[x3].seller;
							newSlotTokenTradeReceipt.buyer = tx.voyageSlot_Token.Owner;
							newSlotTokenTradeReceipt.voyage = tx.voyageSlot_Token.voyage;
							newSlotTokenTradeReceipt.containerSlotQuantity_TEU = slotTokenSellOrders[x3].containerSlotQuantity_TEU;
							newSlotTokenTradeReceipt.sellMinPriceLimit = slotTokenSellOrders[x3].sellPriceLimit;
							newSlotTokenTradeReceipt.buyMaxPriceLimit = tx.buyPrice;
							newSlotTokenTradeReceipt.totalDue = slotTokenSellOrders[x3].containerSlotQuantity_TEU * slotTokenSellOrders[x3].sellPriceLimit;
							newSlotTokenTradeReceipt.isPaid = false;
							newSlotTokenTradeReceipt.created = tx.timestamp;
							newSlotTokenTradeReceipt.buyOrder = newSlotTokenBuyOrder;
							newSlotTokenTradeReceipt.sellOrder = slotTokenSellOrders[x3];
							await slotTokenTradeReceiptRegistry.add(newSlotTokenTradeReceipt);
              tx.nextID++;
              
              tx.voyageSlot_Token.valuePurchased += newSlotTokenTradeReceipt.totalDue; 

              let sellerToken = await voyageSlotTokenRegistry.get(slotTokenSellOrders[x3].sellerToken.$identifier);
              sellerToken.tokensSelling_TEU  -= newSlotTokenTradeReceipt.containerSlotQuantity_TEU;
              sellerToken.tokensSold_TEU  += newSlotTokenTradeReceipt.containerSlotQuantity_TEU;
              sellerToken.valueSold  += newSlotTokenTradeReceipt.totalDue;
              await voyageSlotTokenRegistry.update(sellerToken);
						}
					}
					
				}
			}
			// Not enough Tokens to forfill Buy Order
			break;
		}
	}
	let newSlotTokenBuyOrder = factory.newResource('org.example.shipping', 'SlotTokenBuyOrder', tx.nextID + '');
	newSlotTokenBuyOrder.buyer = tx.voyageSlot_Token.Owner;
	newSlotTokenBuyOrder.buyerToken = tx.voyageSlot_Token;
	newSlotTokenBuyOrder.buyPriceLimit = tx.buyPrice;
	newSlotTokenBuyOrder.voyage = tx.voyageSlot_Token.voyage;
	newSlotTokenBuyOrder.createdByUser = currentParticipant;
	newSlotTokenBuyOrder.lastModifiedByUser = currentParticipant;
	newSlotTokenBuyOrder.created = tx.timestamp;
	newSlotTokenBuyOrder.lastModified = tx.timestamp;
	newSlotTokenBuyOrder.status = "Pending";
	newSlotTokenBuyOrder.containerSlotQuantity_TEU = tx.quantity;
  await slotTokenBuyOrderRegistry.add(newSlotTokenBuyOrder);
  
  tx.voyageSlot_Token.tokensBuying_TEU  += tx.quantity;
  await voyageSlotTokenRegistry.update(tx.voyageSlot_Token);

	return ("Buy Order Submitted");
}











/**
 * Transaction processor function.
 * @param {org.example.shipping.VoyageToken_EditBuyOrder} tx The transaction instance.
 * @transaction
 */
async function voyageToken_EditBuyOrder(tx) {
	var factory = getFactory();
	var currentParticipant = getCurrentParticipant();
	const carrierEmployeeRegistary = await getParticipantRegistry('org.example.shipping.CarrierEmployee');
	const slotTokenTradeReceiptRegistry = await getAssetRegistry('org.example.shipping.SlotTokenTradeReceipt');
	const slotTokenSellOrderRegistry = await getAssetRegistry('org.example.shipping.SlotTokenSellOrder');
	const slotTokenBuyOrderRegistry = await getAssetRegistry('org.example.shipping.SlotTokenBuyOrder');
	const voyageSlotTokenRegistry = await getAssetRegistry('org.example.shipping.VoyageSlot_Token');

	let systemUser = await carrierEmployeeRegistary.get("System");
	let noOfTokensBeingSold = tx.quantity;

	let slotTokenSellOrders = await query('getSlotTokenSellOrder_WithMaxPrice',
	{
		"voyage": tx.voyageSlot_Token.voyage.toURI(),
		"organisation": tx.voyageSlot_Token.Owner.toURI(),
		"maxPrice": tx.buyPrice
	});

	  // Optimisation: If Voyage is the same, and quantity is increased or price is lowered, all else unchanged, there is no point searching sell orders
	if (tx.voyageSlot_Token.voyageSlot_TokenID == tx.buyOrder.buyerToken.voyageSlot_TokenID){
		if(tx.quantity >= tx.buyOrder.containerSlotQuantity_TEU && tx.buyPrice <= tx.buyOrder.buyPriceLimit){
			tx.buyOrder.containerSlotQuantity_TEU = tx.quantity;
			tx.buyOrder.buyPriceLimit = tx.buyPrice;
			tx.buyOrder.lastModifiedByUser = currentParticipant;
      tx.buyOrder.lastModified = tx.timestamp; 
      await slotTokenBuyOrderRegistry.update(tx.buyOrder);
      
      let tokenDifference = tx.buyOrder.containerSlotQuantity_TEU - tx.quantity; 
      tx.voyageSlot_Token.tokensBuying_TEU  -= tokenDifference; // Double negitive
      await voyageSlotTokenRegistry.update(tx.voyageSlot_Token);
			return("Buy Order Updated");
	  }     
  }  
  
  if (tx.voyageSlot_Token.voyageSlot_TokenID != tx.buyOrder.buyerToken.voyageSlot_TokenID){
    //Voyage changed: Refund Tokens for old Voyage
   tx.buyOrder.buyerToken.tokensBuying_TEU -= tx.buyOrder.containerSlotQuantity_TEU;
   voyageSlotTokenRegistry.update(tx.buyOrder.buyerToken);
 }else {
   // Same Voyage, Refund tokens for current voyage until new order is made
   tx.voyageSlot_Token.tokensBuying_TEU -= tx.buyOrder.containerSlotQuantity_TEU;
 }

	await slotTokenBuyOrderRegistry.remove(tx.buyOrder);


	// Much simpiler than Creating a Sell Order : Just loops Sell order(s)
	for (let x = 0; x < slotTokenSellOrders.length; x++) {
		if (slotTokenSellOrders[x].containerSlotQuantity_TEU == tx.quantity) {
			// Stop: new BuyOrder Exactly forfills a sell Order
			// create recipt and buy Order
			let newSlotTokenBuyOrder = factory.newResource('org.example.shipping', 'SlotTokenBuyOrder', tx.nextID + '');
			newSlotTokenBuyOrder.buyer = tx.voyageSlot_Token.Owner;
			newSlotTokenBuyOrder.buyerToken = tx.voyageSlot_Token;
			newSlotTokenBuyOrder.buyPriceLimit = tx.buyPrice;
			newSlotTokenBuyOrder.voyage = tx.voyageSlot_Token.voyage;
			newSlotTokenBuyOrder.createdByUser = tx.buyOrder.createdByUser;
			newSlotTokenBuyOrder.lastModifiedByUser = currentParticipant;
			newSlotTokenBuyOrder.created = tx.buyOrder.created;
			newSlotTokenBuyOrder.lastModified = tx.timestamp;
			newSlotTokenBuyOrder.status = "Forfilled";
			newSlotTokenBuyOrder.containerSlotQuantity_TEU = tx.quantity;
			await slotTokenBuyOrderRegistry.add(newSlotTokenBuyOrder);

			slotTokenSellOrders[x].status = "Forfilled";
			await slotTokenSellOrderRegistry.update(slotTokenSellOrders[x]);

			let newSlotTokenTradeReceipt = factory.newResource('org.example.shipping', 'SlotTokenTradeReceipt', tx.nextID + '');
			newSlotTokenTradeReceipt.seller = slotTokenSellOrders[x].seller;
			newSlotTokenTradeReceipt.buyer = tx.voyageSlot_Token.Owner;
			newSlotTokenTradeReceipt.voyage = tx.voyageSlot_Token.voyage;
			newSlotTokenTradeReceipt.containerSlotQuantity_TEU = tx.quantity;
			newSlotTokenTradeReceipt.sellMinPriceLimit = slotTokenSellOrders[x].sellPriceLimit;
			newSlotTokenTradeReceipt.buyMaxPriceLimit = tx.buyPrice;
			newSlotTokenTradeReceipt.totalDue = tx.quantity * slotTokenSellOrders[x].sellPriceLimit;
			newSlotTokenTradeReceipt.isPaid = false;
			newSlotTokenTradeReceipt.created = tx.timestamp;
			newSlotTokenTradeReceipt.buyOrder = newSlotTokenBuyOrder;
			newSlotTokenTradeReceipt.sellOrder = slotTokenSellOrders[x];
			await slotTokenTradeReceiptRegistry.add(newSlotTokenTradeReceipt);

      tx.voyageSlot_Token.SlotCountBalance_TEU = tx.voyageSlot_Token.SlotCountBalance_TEU + tx.quantity;
      tx.voyageSlot_Token.tokensPurchased_TEU += newSlotTokenTradeReceipt.containerSlotQuantity_TEU;
      tx.voyageSlot_Token.valuePurchased += newSlotTokenTradeReceipt.totalDue;
      await voyageSlotTokenRegistry.update(tx.voyageSlot_Token);
      
      let sellerToken = await voyageSlotTokenRegistry.get(slotTokenSellOrders[x].sellerToken.$identifier);
      sellerToken.tokensSelling_TEU  -= newSlotTokenTradeReceipt.containerSlotQuantity_TEU;
      sellerToken.tokensSold_TEU  += newSlotTokenTradeReceipt.containerSlotQuantity_TEU;
      sellerToken.valueSold  += newSlotTokenTradeReceipt.totalDue;
      await voyageSlotTokenRegistry.update(sellerToken);

			return ("Modified Buy Order of " + noOfTokensBeingSold + "tokens has been Forfilled, View Receipt in Tokens Bought");
			break;
		} else if (slotTokenSellOrders[x].containerSlotQuantity_TEU > tx.quantity) {
			//a SellOrder can Cover the new Buy Order with extra, will split Sell Order

			let newSlotTokenBuyOrder = factory.newResource('org.example.shipping', 'SlotTokenBuyOrder', tx.nextID + '');
			newSlotTokenBuyOrder.buyer = tx.voyageSlot_Token.Owner;
			newSlotTokenBuyOrder.buyerToken = tx.voyageSlot_Token;
			newSlotTokenBuyOrder.buyPriceLimit = tx.buyPrice;
			newSlotTokenBuyOrder.voyage = tx.voyageSlot_Token.voyage;
			newSlotTokenBuyOrder.createdByUser = tx.buyOrder.createdByUser;
			newSlotTokenBuyOrder.lastModifiedByUser = currentParticipant;
			newSlotTokenBuyOrder.created = tx.buyOrder.created;
			newSlotTokenBuyOrder.lastModified = tx.timestamp;
			newSlotTokenBuyOrder.status = "Forfilled";
			newSlotTokenBuyOrder.containerSlotQuantity_TEU = tx.quantity;
			await slotTokenBuyOrderRegistry.add(newSlotTokenBuyOrder);
			// Sold portion of the Sell Order
			let newSlotTokenSellOrder = factory.newResource('org.example.shipping', 'SlotTokenSellOrder', tx.nextID + '');
			newSlotTokenSellOrder.seller = slotTokenSellOrders[x].seller;
			newSlotTokenSellOrder.sellerToken = slotTokenSellOrders[x].sellerToken;
			newSlotTokenSellOrder.sellPriceLimit = slotTokenSellOrders[x].sellPriceLimit;
			newSlotTokenSellOrder.voyage = slotTokenSellOrders[x].voyage;
			newSlotTokenSellOrder.createdByUser = slotTokenSellOrders[x].createdByUser;
			newSlotTokenSellOrder.lastModifiedByUser = systemUser; // System
			newSlotTokenSellOrder.created = slotTokenSellOrders[x].created;
			newSlotTokenSellOrder.lastModified = tx.timestamp;
			newSlotTokenSellOrder.status = "Forfilled";
			newSlotTokenSellOrder.containerSlotQuantity_TEU = tx.quantity;
			await slotTokenSellOrderRegistry.add(newSlotTokenSellOrder);
			// Remainder of Sell order
			slotTokenSellOrders[x].lastModifiedByUser = systemUser; // System
			slotTokenSellOrders[x].lastModified = tx.timestamp;
			slotTokenSellOrders[x].containerSlotQuantity_TEU = slotTokenSellOrders[x].containerSlotQuantity_TEU - tx.quantity;
			await slotTokenSellOrderRegistry.update(slotTokenSellOrders[x]);

			let newSlotTokenTradeReceipt = factory.newResource('org.example.shipping', 'SlotTokenTradeReceipt', tx.nextID + '');
			newSlotTokenTradeReceipt.seller = slotTokenSellOrders[x].seller;
			newSlotTokenTradeReceipt.buyer = tx.voyageSlot_Token.Owner;
			newSlotTokenTradeReceipt.voyage = tx.voyageSlot_Token.voyage;
			newSlotTokenTradeReceipt.containerSlotQuantity_TEU = tx.quantity;
			newSlotTokenTradeReceipt.sellMinPriceLimit = slotTokenSellOrders[x].sellPriceLimit;
			newSlotTokenTradeReceipt.buyMaxPriceLimit = tx.buyPrice;
			newSlotTokenTradeReceipt.totalDue = tx.quantity * slotTokenSellOrders[x].sellPriceLimit;
			newSlotTokenTradeReceipt.isPaid = false;
			newSlotTokenTradeReceipt.created = tx.timestamp;
			newSlotTokenTradeReceipt.buyOrder = newSlotTokenBuyOrder;
			newSlotTokenTradeReceipt.sellOrder = newSlotTokenSellOrder;
			await slotTokenTradeReceiptRegistry.add(newSlotTokenTradeReceipt);

      tx.voyageSlot_Token.SlotCountBalance_TEU = tx.voyageSlot_Token.SlotCountBalance_TEU + tx.quantity;
      tx.voyageSlot_Token.tokensPurchased_TEU += newSlotTokenTradeReceipt.containerSlotQuantity_TEU;
      tx.voyageSlot_Token.valuePurchased += newSlotTokenTradeReceipt.totalDue;
      await voyageSlotTokenRegistry.update(tx.voyageSlot_Token);
      
      let sellerToken = await voyageSlotTokenRegistry.get(slotTokenSellOrders[x].sellerToken.$identifier);
      sellerToken.tokensSelling_TEU  -= newSlotTokenTradeReceipt.containerSlotQuantity_TEU;
      sellerToken.tokensSold_TEU  += newSlotTokenTradeReceipt.containerSlotQuantity_TEU;
      sellerToken.valueSold  += newSlotTokenTradeReceipt.totalDue;
      await voyageSlotTokenRegistry.update(sellerToken);

			return ("Modified Buy Order of " + noOfTokensBeingSold + "tokens has been Forfilled, View Receipt in Tokens Bought");
		} else {   // slotTokenSellOrders[x].containerSlotQuantity_TEU < tx.quantity
			// a Sell order partially forfills the new Buy order,
			// Loop through all sell orders to see if we can forfill the buy order

			let sellQuantityAtValidPrice = 0;
			for (let x2 = x; x2 < slotTokenSellOrders.length; x2++) {
				sellQuantityAtValidPrice += slotTokenSellOrders[x2].containerSlotQuantity_TEU;
				if (sellQuantityAtValidPrice >= tx.quantity) {
					// We have Enough sell Orders to complete Buy order
					// Create the Buy Order First
					let newSlotTokenBuyOrder = factory.newResource('org.example.shipping', 'SlotTokenBuyOrder', tx.nextID + '');
					newSlotTokenBuyOrder.buyer = tx.voyageSlot_Token.Owner;
					newSlotTokenBuyOrder.buyerToken = tx.voyageSlot_Token;
					newSlotTokenBuyOrder.buyPriceLimit = tx.buyPrice;
					newSlotTokenBuyOrder.voyage = tx.voyageSlot_Token.voyage;
					newSlotTokenBuyOrder.createdByUser = tx.buyOrder.createdByUser;
					newSlotTokenBuyOrder.lastModifiedByUser = currentParticipant;
					newSlotTokenBuyOrder.created = tx.buyOrder.created;
					newSlotTokenBuyOrder.lastModified = tx.timestamp;
					newSlotTokenBuyOrder.status = "Forfilled";
					newSlotTokenBuyOrder.containerSlotQuantity_TEU = tx.quantity;
					await slotTokenBuyOrderRegistry.add(newSlotTokenBuyOrder);

          tx.voyageSlot_Token.SlotCountBalance_TEU = tx.voyageSlot_Token.SlotCountBalance_TEU + tx.quantity;
          tx.voyageSlot_Token.tokensPurchased_TEU += tx.quantity;
					// Then Loop through Sell orders and Create receipts
					let leftoverTokensFromLastSellOffer = sellQuantityAtValidPrice - tx.quantity;
					for (let x3 = x; x3 <= x2; x3++){
						if (x3 == x2) {
							// If last Sell Offer 
							if (leftoverTokensFromLastSellOffer > 0){
							  //if there are excess tokens, Split the Sell Order
								// Sold portion of the Sell Order
								let tokensSoldFromFinalSellOrder = slotTokenSellOrders[x3].containerSlotQuantity_TEU - leftoverTokensFromLastSellOffer;
								let newSlotTokenSellOrder = factory.newResource('org.example.shipping', 'SlotTokenSellOrder', tx.nextID + '');
								newSlotTokenSellOrder.seller = slotTokenSellOrders[x3].seller;
								newSlotTokenSellOrder.sellerToken = slotTokenSellOrders[x3].sellerToken;
								newSlotTokenSellOrder.sellPriceLimit = slotTokenSellOrders[x3].sellPriceLimit;
								newSlotTokenSellOrder.voyage = slotTokenSellOrders[x3].voyage;
								newSlotTokenSellOrder.createdByUser = slotTokenSellOrders[x3].createdByUser;
								newSlotTokenSellOrder.lastModifiedByUser = systemUser; // System
								newSlotTokenSellOrder.created = slotTokenSellOrders[x3].created;
								newSlotTokenSellOrder.lastModified = tx.timestamp;
								newSlotTokenSellOrder.status = "Forfilled";
								newSlotTokenSellOrder.containerSlotQuantity_TEU = tokensSoldFromFinalSellOrder;
								await slotTokenSellOrderRegistry.add(newSlotTokenSellOrder);

								let newSlotTokenTradeReceipt = factory.newResource('org.example.shipping', 'SlotTokenTradeReceipt', tx.nextID + '');
								newSlotTokenTradeReceipt.seller = slotTokenSellOrders[x3].seller;
								newSlotTokenTradeReceipt.buyer = tx.voyageSlot_Token.Owner;
								newSlotTokenTradeReceipt.voyage = tx.voyageSlot_Token.voyage;
								newSlotTokenTradeReceipt.containerSlotQuantity_TEU = tokensSoldFromFinalSellOrder;
								newSlotTokenTradeReceipt.sellMinPriceLimit = slotTokenSellOrders[x3].sellPriceLimit;
								newSlotTokenTradeReceipt.buyMaxPriceLimit = tx.buyPrice;
								newSlotTokenTradeReceipt.totalDue = tokensSoldFromFinalSellOrder * slotTokenSellOrders[x3].sellPriceLimit;
								newSlotTokenTradeReceipt.isPaid = false;
								newSlotTokenTradeReceipt.created = tx.timestamp;
								newSlotTokenTradeReceipt.buyOrder = newSlotTokenBuyOrder;
								newSlotTokenTradeReceipt.sellOrder = newSlotTokenSellOrder;
								await slotTokenTradeReceiptRegistry.add(newSlotTokenTradeReceipt);

								// Remainder of Sell order
								slotTokenSellOrders[x3].lastModifiedByUser = systemUser; // System
								slotTokenSellOrders[x3].lastModified = tx.timestamp;
								slotTokenSellOrders[x3].containerSlotQuantity_TEU = leftoverTokensFromLastSellOffer;
                await slotTokenSellOrderRegistry.update(slotTokenSellOrders[x3]);	
                
                tx.voyageSlot_Token.valuePurchased += newSlotTokenTradeReceipt.totalDue; 
                await voyageSlotTokenRegistry.update(tx.voyageSlot_Token);

                let sellerToken = await voyageSlotTokenRegistry.get(slotTokenSellOrders[x3].sellerToken.$identifier);
                sellerToken.tokensSelling_TEU  -= newSlotTokenTradeReceipt.containerSlotQuantity_TEU;
                sellerToken.tokensSold_TEU  += newSlotTokenTradeReceipt.containerSlotQuantity_TEU;
                sellerToken.valueSold  += newSlotTokenTradeReceipt.totalDue;
                await voyageSlotTokenRegistry.update(sellerToken);

								return ("Modified Buy Order of " + noOfTokensBeingSold + "tokens has been Forfilled by multiple Sell Orders, View Receipts in Tokens Bought");							
							
							}else{
								// No leftover Tokens, Finish Last sale Order and Exit
								slotTokenSellOrders[x3].status = "Forfilled";
								await slotTokenSellOrderRegistry.update(slotTokenSellOrders[x3]);
	
								let newSlotTokenTradeReceipt = factory.newResource('org.example.shipping', 'SlotTokenTradeReceipt', tx.nextID + '');
								newSlotTokenTradeReceipt.seller = slotTokenSellOrders[x3].seller;
								newSlotTokenTradeReceipt.buyer = tx.voyageSlot_Token.Owner;
								newSlotTokenTradeReceipt.voyage = tx.voyageSlot_Token.voyage;
								newSlotTokenTradeReceipt.containerSlotQuantity_TEU = slotTokenSellOrders[x3].containerSlotQuantity_TEU;
								newSlotTokenTradeReceipt.sellMinPriceLimit = slotTokenSellOrders[x3].sellPriceLimit;
								newSlotTokenTradeReceipt.buyMaxPriceLimit = tx.buyPrice;
								newSlotTokenTradeReceipt.totalDue = slotTokenSellOrders[x3].containerSlotQuantity_TEU * slotTokenSellOrders[x3].sellPriceLimit;
								newSlotTokenTradeReceipt.isPaid = false;
								newSlotTokenTradeReceipt.created = tx.timestamp;
								newSlotTokenTradeReceipt.buyOrder = newSlotTokenBuyOrder;
								newSlotTokenTradeReceipt.sellOrder = slotTokenSellOrders[x3];
								await slotTokenTradeReceiptRegistry.add(newSlotTokenTradeReceipt);

                tx.voyageSlot_Token.valuePurchased += newSlotTokenTradeReceipt.totalDue;
                await voyageSlotTokenRegistry.update(tx.voyageSlot_Token);

                let sellerToken = await voyageSlotTokenRegistry.get(slotTokenSellOrders[x3].sellerToken.$identifier);
                sellerToken.tokensSelling_TEU  -= newSlotTokenTradeReceipt.containerSlotQuantity_TEU;
                sellerToken.tokensSold_TEU  += newSlotTokenTradeReceipt.containerSlotQuantity_TEU;
                sellerToken.valueSold  += newSlotTokenTradeReceipt.totalDue;
                await voyageSlotTokenRegistry.update(sellerToken);

								return ("Modified Buy Order of " + noOfTokensBeingSold + "tokens has been Forfilled by multiple Sell Orders, View Receipts in Tokens Bought");
							}
						}else{
							// Not the last Sell Order, create recipt as normal
							slotTokenSellOrders[x3].status = "Forfilled";
							await slotTokenSellOrderRegistry.update(slotTokenSellOrders[x3]);

							let newSlotTokenTradeReceipt = factory.newResource('org.example.shipping', 'SlotTokenTradeReceipt', tx.nextID + '');
							newSlotTokenTradeReceipt.seller = slotTokenSellOrders[x3].seller;
							newSlotTokenTradeReceipt.buyer = tx.voyageSlot_Token.Owner;
							newSlotTokenTradeReceipt.voyage = tx.voyageSlot_Token.voyage;
							newSlotTokenTradeReceipt.containerSlotQuantity_TEU = slotTokenSellOrders[x3].containerSlotQuantity_TEU;
							newSlotTokenTradeReceipt.sellMinPriceLimit = slotTokenSellOrders[x3].sellPriceLimit;
							newSlotTokenTradeReceipt.buyMaxPriceLimit = tx.buyPrice;
							newSlotTokenTradeReceipt.totalDue = slotTokenSellOrders[x3].containerSlotQuantity_TEU * slotTokenSellOrders[x3].sellPriceLimit;
							newSlotTokenTradeReceipt.isPaid = false;
							newSlotTokenTradeReceipt.created = tx.timestamp;
							newSlotTokenTradeReceipt.buyOrder = newSlotTokenBuyOrder;
							newSlotTokenTradeReceipt.sellOrder = slotTokenSellOrders[x3];
							await slotTokenTradeReceiptRegistry.add(newSlotTokenTradeReceipt);
              tx.nextID++;
              
              tx.voyageSlot_Token.valuePurchased += newSlotTokenTradeReceipt.totalDue;

              let sellerToken = await voyageSlotTokenRegistry.get(slotTokenSellOrders[x3].sellerToken.$identifier);
              sellerToken.tokensSelling_TEU  -= newSlotTokenTradeReceipt.containerSlotQuantity_TEU;
              sellerToken.tokensSold_TEU  += newSlotTokenTradeReceipt.containerSlotQuantity_TEU;
              sellerToken.valueSold  += newSlotTokenTradeReceipt.totalDue;
              await voyageSlotTokenRegistry.update(sellerToken);
						}
					}
					
				}
			}
			// Not enough Tokens to forfill Buy Order
			break;
		}
	}
	let newSlotTokenBuyOrder = factory.newResource('org.example.shipping', 'SlotTokenBuyOrder', tx.nextID + '');
	newSlotTokenBuyOrder.buyer = tx.voyageSlot_Token.Owner;
	newSlotTokenBuyOrder.buyerToken = tx.voyageSlot_Token;
	newSlotTokenBuyOrder.buyPriceLimit = tx.buyPrice;
	newSlotTokenBuyOrder.voyage = tx.voyageSlot_Token.voyage;
	newSlotTokenBuyOrder.createdByUser = tx.buyOrder.createdByUser;
	newSlotTokenBuyOrder.lastModifiedByUser = currentParticipant;
	newSlotTokenBuyOrder.created = tx.buyOrder.created;
	newSlotTokenBuyOrder.lastModified = tx.timestamp;
	newSlotTokenBuyOrder.status = "Pending";
	newSlotTokenBuyOrder.containerSlotQuantity_TEU = tx.quantity;
  await slotTokenBuyOrderRegistry.add(newSlotTokenBuyOrder);
  
  tx.voyageSlot_Token.tokensBuying_TEU  += tx.quantity;
  await voyageSlotTokenRegistry.update(tx.voyageSlot_Token);

	return ("Buy Order Modified");
}

