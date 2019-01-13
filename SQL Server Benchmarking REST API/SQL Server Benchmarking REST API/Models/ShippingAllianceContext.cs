using System;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata;

namespace SQL_Server_Benchmarking_REST_API.Models
{
    public partial class ShippingAllianceContext : DbContext
    {
        public ShippingAllianceContext()
        {
        }

        public ShippingAllianceContext(DbContextOptions<ShippingAllianceContext> options)
            : base(options)
        {
        }

        public virtual DbSet<CarrierEmployee> CarrierEmployee { get; set; }
        public virtual DbSet<Container> Container { get; set; }
        public virtual DbSet<ContainerYardLocation> ContainerYardLocation { get; set; }
        public virtual DbSet<Event> Event { get; set; }
        public virtual DbSet<Organisation> Organisation { get; set; }
        public virtual DbSet<Participant> Participant { get; set; }
        public virtual DbSet<Port> Port { get; set; }
        public virtual DbSet<Ship> Ship { get; set; }
        public virtual DbSet<ShipmentJob> ShipmentJob { get; set; }
        public virtual DbSet<SlotTokenBuyOrder> SlotTokenBuyOrder { get; set; }
        public virtual DbSet<SlotTokenSellOrder> SlotTokenSellOrder { get; set; }
        public virtual DbSet<SlotTokenTradeReceipt> SlotTokenTradeReceipt { get; set; }
        public virtual DbSet<Terminal> Terminal { get; set; }
        public virtual DbSet<TransactionHistory> TransactionHistory { get; set; }
        public virtual DbSet<Voyage> Voyage { get; set; }
        public virtual DbSet<VoyageSlotToken> VoyageSlotToken { get; set; }

        protected override void OnConfiguring(DbContextOptionsBuilder optionsBuilder)
        {
            if (!optionsBuilder.IsConfigured)
            {
#warning To protect potentially sensitive information in your connection string, you should move it out of source code. See http://go.microsoft.com/fwlink/?LinkId=723263 for guidance on storing connection strings.
                optionsBuilder.UseSqlServer("Server=LAPTOP-30EFDN4T\\SQLEXPRESS;Database=ShippingAlliance;Trusted_Connection=True;");
            }
        }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            modelBuilder.Entity<CarrierEmployee>(entity =>
            {
                entity.HasKey(e => e.UserId);

                entity.Property(e => e.UserId)
                    .HasColumnName("userID")
                    .ValueGeneratedNever();

                entity.Property(e => e.FirstName)
                    .HasColumnName("firstName")
                    .HasMaxLength(100);

                entity.Property(e => e.LastName)
                    .HasColumnName("lastName")
                    .HasMaxLength(100);

                entity.Property(e => e.Organisation).HasColumnName("organisation");

                entity.HasOne(d => d.OrganisationNavigation)
                    .WithMany(p => p.CarrierEmployee)
                    .HasForeignKey(d => d.Organisation)
                    .HasConstraintName("FK_CarrierEmployee_Organisation");
            });

            modelBuilder.Entity<Container>(entity =>
            {
                entity.ToTable("container");

                entity.Property(e => e.ContainerId)
                    .HasColumnName("containerID")
                    .ValueGeneratedNever();

                entity.Property(e => e.Carrier)
                    .HasColumnName("carrier")
                    .HasMaxLength(100);

                entity.Property(e => e.ContainerCapacityTeu)
                    .HasColumnName("ContainerCapacity_TEU")
                    .HasMaxLength(100);

                entity.Property(e => e.ContainerLocationStatus)
                    .HasColumnName("containerLocationStatus")
                    .HasMaxLength(100);

                entity.Property(e => e.ContainerType).HasMaxLength(100);

                entity.Property(e => e.CurrentContainerVoyage)
                    .HasColumnName("currentContainer_Voyage")
                    .HasMaxLength(100);

                entity.Property(e => e.CurrentContainerYardLocation)
                    .HasColumnName("currentContainerYardLocation")
                    .HasMaxLength(100);

                entity.Property(e => e.CurrentJob)
                    .HasColumnName("currentJob")
                    .HasMaxLength(100);

                entity.Property(e => e.IsAvalibleForUse)
                    .HasColumnName("isAvalibleForUse")
                    .HasMaxLength(100);

                entity.Property(e => e.IsCustomerSuppliedContainer).HasColumnName("isCustomerSuppliedContainer");

                entity.Property(e => e.Owner)
                    .HasColumnName("owner")
                    .HasMaxLength(100);
            });

            modelBuilder.Entity<ContainerYardLocation>(entity =>
            {
                entity.Property(e => e.ContainerYardLocationId)
                    .HasColumnName("containerYardLocationID")
                    .ValueGeneratedNever();

                entity.Property(e => e.Address).HasMaxLength(100);

                entity.Property(e => e.ClosistPort)
                    .HasColumnName("closistPort")
                    .HasMaxLength(100);

                entity.Property(e => e.IdleContainers)
                    .HasColumnName("idleContainers")
                    .HasMaxLength(100);

                entity.Property(e => e.IsSharedYard)
                    .HasColumnName("isSharedYard")
                    .HasMaxLength(100);

                entity.Property(e => e.Organisation)
                    .HasColumnName("organisation")
                    .HasMaxLength(100);
            });

            modelBuilder.Entity<Event>(entity =>
            {
                entity.ToTable("Event_");

                entity.Property(e => e.EventId)
                    .HasColumnName("eventID")
                    .ValueGeneratedNever();

                entity.Property(e => e.Container)
                    .HasColumnName("container")
                    .HasMaxLength(100);

                entity.Property(e => e.Message).HasColumnName("message");

                entity.Property(e => e.Ship)
                    .HasColumnName("ship")
                    .HasMaxLength(100);

                entity.Property(e => e.Voyage)
                    .HasColumnName("voyage")
                    .HasMaxLength(100);
            });

            modelBuilder.Entity<Organisation>(entity =>
            {
                entity.Property(e => e.OrganisationId)
                    .HasColumnName("organisationID")
                    .ValueGeneratedNever();

                entity.Property(e => e.Alliance).HasMaxLength(100);

                entity.Property(e => e.Name)
                    .HasColumnName("name")
                    .HasMaxLength(100);
            });

            modelBuilder.Entity<Participant>(entity =>
            {
                entity.HasKey(e => e.UserId);

                entity.ToTable("participant");

                entity.Property(e => e.UserId)
                    .HasColumnName("userID")
                    .ValueGeneratedNever();

                entity.Property(e => e.FirstName)
                    .HasColumnName("firstName")
                    .HasMaxLength(100);

                entity.Property(e => e.LastName)
                    .HasColumnName("lastName")
                    .HasMaxLength(100);

                entity.Property(e => e.Organisation)
                    .HasColumnName("organisation")
                    .HasMaxLength(100);
            });

            modelBuilder.Entity<Port>(entity =>
            {
                entity.Property(e => e.PortId)
                    .HasColumnName("portID")
                    .ValueGeneratedNever();

                entity.Property(e => e.City)
                    .HasColumnName("city")
                    .HasMaxLength(100);

                entity.Property(e => e.Country)
                    .HasColumnName("country")
                    .HasMaxLength(100);

                entity.Property(e => e.PortName)
                    .HasColumnName("portName")
                    .HasMaxLength(100);

                entity.Property(e => e.Terminals).HasColumnName("terminals");
            });

            modelBuilder.Entity<Ship>(entity =>
            {
                entity.Property(e => e.ShipId)
                    .HasColumnName("shipID")
                    .ValueGeneratedNever();

                entity.Property(e => e.CallSign)
                    .HasColumnName("callSign")
                    .HasMaxLength(100);

                entity.Property(e => e.ContainerCapacityTeu)
                    .HasColumnName("containerCapacity_TEU")
                    .HasMaxLength(100);

                entity.Property(e => e.CurrentVoyage)
                    .HasColumnName("currentVoyage")
                    .HasMaxLength(100);

                entity.Property(e => e.Operator)
                    .HasColumnName("operator")
                    .HasMaxLength(100);

                entity.Property(e => e.Owner)
                    .HasColumnName("owner")
                    .HasMaxLength(100);

                entity.Property(e => e.ShipName)
                    .HasColumnName("shipName")
                    .HasMaxLength(100);
            });

            modelBuilder.Entity<ShipmentJob>(entity =>
            {
                entity.ToTable("Shipment_Job");

                entity.Property(e => e.ShipmentJobId)
                    .HasColumnName("shipment_JobID")
                    .ValueGeneratedNever();

                entity.Property(e => e.Carrier)
                    .HasColumnName("carrier")
                    .HasMaxLength(100);

                entity.Property(e => e.CarrierHaulageDropoffLocation)
                    .HasColumnName("carrierHaulageDropoffLocation")
                    .HasMaxLength(100);

                entity.Property(e => e.CarrierHaulagePickupLocation)
                    .HasColumnName("carrierHaulagePickupLocation")
                    .HasMaxLength(100);

                entity.Property(e => e.Container).HasMaxLength(100);

                entity.Property(e => e.Created)
                    .HasColumnName("created")
                    .HasMaxLength(100);

                entity.Property(e => e.CreatedByUser)
                    .HasColumnName("createdByUser")
                    .HasMaxLength(100);

                entity.Property(e => e.Customer)
                    .HasColumnName("customer")
                    .HasMaxLength(100);

                entity.Property(e => e.CustomerContainer)
                    .HasColumnName("customerContainer")
                    .HasMaxLength(100);

                entity.Property(e => e.CustomerContainerFinalDropOffLocation).HasMaxLength(100);

                entity.Property(e => e.CustomerId)
                    .HasColumnName("customerID")
                    .HasMaxLength(100);

                entity.Property(e => e.CustomerLoadGoodsIntoContainerDropoffLocation).HasMaxLength(100);

                entity.Property(e => e.CustomerPreShipingContainerPickupLocation).HasMaxLength(100);

                entity.Property(e => e.CustomerPreferedArrivalDate).HasMaxLength(100);

                entity.Property(e => e.CustomerPreferedDepartureDate).HasMaxLength(100);

                entity.Property(e => e.CustomerWillDropContainerAtPort).HasMaxLength(100);

                entity.Property(e => e.CustomerWillPickupContainerAtFinalDestination).HasMaxLength(100);

                entity.Property(e => e.DesinationHaulageType)
                    .HasColumnName("desinationHaulageType")
                    .HasMaxLength(100);

                entity.Property(e => e.FinalPort)
                    .HasColumnName("finalPort")
                    .HasMaxLength(100);

                entity.Property(e => e.InitialPort)
                    .HasColumnName("initialPort")
                    .HasMaxLength(100);

                entity.Property(e => e.IsCustomerSuppliedContainer)
                    .HasColumnName("isCustomerSuppliedContainer")
                    .HasMaxLength(100);

                entity.Property(e => e.JobStatus)
                    .HasColumnName("jobStatus")
                    .HasMaxLength(100);

                entity.Property(e => e.LastModified)
                    .HasColumnName("lastModified")
                    .HasMaxLength(100);

                entity.Property(e => e.LastModifiedByUser)
                    .HasColumnName("lastModifiedByUser")
                    .HasMaxLength(100);

                entity.Property(e => e.OriginHaulageType)
                    .HasColumnName("originHaulageType")
                    .HasMaxLength(100);

                entity.Property(e => e.QuoteComputedBestVoyages).HasColumnName("quoteComputedBestVoyages");

                entity.Property(e => e.RecievedPayment)
                    .HasColumnName("recievedPayment")
                    .HasMaxLength(100);
            });

            modelBuilder.Entity<SlotTokenBuyOrder>(entity =>
            {
                entity.Property(e => e.SlotTokenBuyOrderId)
                    .HasColumnName("slotTokenBuyOrderID")
                    .ValueGeneratedNever();

                entity.Property(e => e.BuyPriceLimit).HasColumnName("buyPriceLimit");

                entity.Property(e => e.Buyer)
                    .HasColumnName("buyer")
                    .HasMaxLength(100);

                entity.Property(e => e.BuyerToken)
                    .HasColumnName("buyerToken")
                    .HasMaxLength(100);

                entity.Property(e => e.ContainerSlotQuantityTeu).HasColumnName("containerSlotQuantity_TEU");

                entity.Property(e => e.Created)
                    .HasColumnName("created")
                    .HasMaxLength(100);

                entity.Property(e => e.CreatedByUser)
                    .HasColumnName("createdByUser")
                    .HasMaxLength(100);

                entity.Property(e => e.LastModified)
                    .HasColumnName("lastModified")
                    .HasMaxLength(100);

                entity.Property(e => e.LastModifiedByUser)
                    .HasColumnName("lastModifiedByUser")
                    .HasMaxLength(100);

                entity.Property(e => e.Status)
                    .HasColumnName("status")
                    .HasMaxLength(100);

                entity.Property(e => e.Voyage)
                    .HasColumnName("voyage")
                    .HasMaxLength(100);
            });

            modelBuilder.Entity<SlotTokenSellOrder>(entity =>
            {
                entity.Property(e => e.SlotTokenSellOrderId)
                    .HasColumnName("slotTokenSellOrderID")
                    .ValueGeneratedNever();

                entity.Property(e => e.ContainerSlotQuantityTeu).HasColumnName("containerSlotQuantity_TEU");

                entity.Property(e => e.Created)
                    .HasColumnName("created")
                    .HasMaxLength(100);

                entity.Property(e => e.CreatedByUser)
                    .HasColumnName("createdByUser")
                    .HasMaxLength(100);

                entity.Property(e => e.LastModified)
                    .HasColumnName("lastModified")
                    .HasMaxLength(100);

                entity.Property(e => e.LastModifiedByUser)
                    .HasColumnName("lastModifiedByUser")
                    .HasMaxLength(100);

                entity.Property(e => e.SellPriceLimit).HasColumnName("sellPriceLimit");

                entity.Property(e => e.Seller)
                    .HasColumnName("seller")
                    .HasMaxLength(100);

                entity.Property(e => e.SellerToken)
                    .HasColumnName("sellerToken")
                    .HasMaxLength(100);

                entity.Property(e => e.Status)
                    .HasColumnName("status")
                    .HasMaxLength(100);

                entity.Property(e => e.Voyage)
                    .HasColumnName("voyage")
                    .HasMaxLength(100);
            });

            modelBuilder.Entity<SlotTokenTradeReceipt>(entity =>
            {
                entity.Property(e => e.SlotTokenTradeReceiptId)
                    .HasColumnName("slotTokenTradeReceiptID")
                    .ValueGeneratedNever();

                entity.Property(e => e.BuyMaxPriceLimit).HasColumnName("buyMaxPriceLimit");

                entity.Property(e => e.BuyOrder)
                    .HasColumnName("buyOrder")
                    .HasMaxLength(100);

                entity.Property(e => e.Buyer)
                    .HasColumnName("buyer")
                    .HasMaxLength(100);

                entity.Property(e => e.ContainerSlotQuantityTeu).HasColumnName("containerSlotQuantity_TEU");

                entity.Property(e => e.Created)
                    .HasColumnName("created")
                    .HasMaxLength(100);

                entity.Property(e => e.IsPaid)
                    .HasColumnName("isPaid")
                    .HasMaxLength(100);

                entity.Property(e => e.SellMinPriceLimit).HasColumnName("sellMinPriceLimit");

                entity.Property(e => e.SellOrder)
                    .HasColumnName("sellOrder")
                    .HasMaxLength(100);

                entity.Property(e => e.Seller)
                    .HasColumnName("seller")
                    .HasMaxLength(100);

                entity.Property(e => e.TotalDue).HasColumnName("totalDue");

                entity.Property(e => e.Voyage)
                    .HasColumnName("voyage")
                    .HasMaxLength(100);
            });

            modelBuilder.Entity<Terminal>(entity =>
            {
                entity.Property(e => e.TerminalId)
                    .HasColumnName("terminalID")
                    .ValueGeneratedNever();

                entity.Property(e => e.PortName)
                    .HasColumnName("portName")
                    .HasMaxLength(100);

                entity.Property(e => e.TerminalName)
                    .HasColumnName("terminalName")
                    .HasMaxLength(100);
            });

            modelBuilder.Entity<TransactionHistory>(entity =>
            {
                entity.Property(e => e.Id)
                    .HasColumnName("id")
                    .ValueGeneratedNever();

                entity.Property(e => e.Date).HasMaxLength(100);

                entity.Property(e => e.Identity)
                    .HasColumnName("identity")
                    .HasMaxLength(100);

                entity.Property(e => e.Participant)
                    .HasColumnName("participant")
                    .HasMaxLength(100);

                entity.Property(e => e.Transaction)
                    .HasColumnName("transaction")
                    .HasMaxLength(100);
            });

            modelBuilder.Entity<Voyage>(entity =>
            {
                entity.Property(e => e.VoyageId)
                    .HasColumnName("voyageID")
                    .ValueGeneratedNever();

                entity.Property(e => e.ActualDestinationArrivalTimeUtc)
                    .HasColumnName("actualDestinationArrivalTime_UTC")
                    .HasMaxLength(100);

                entity.Property(e => e.ActualDestinationDepartTimeUtc)
                    .HasColumnName("actualDestinationDepartTime_UTC")
                    .HasMaxLength(100);

                entity.Property(e => e.ActualOriginArrivalTimeUtc)
                    .HasColumnName("actualOriginArrivalTime_UTC")
                    .HasMaxLength(100);

                entity.Property(e => e.ActualOriginDepartTimeUtc)
                    .HasColumnName("actualOriginDepartTime_UTC")
                    .HasMaxLength(100);

                entity.Property(e => e.BookedCapacityTeu).HasColumnName("BookedCapacity_TEU");

                entity.Property(e => e.Contract)
                    .HasColumnName("contract")
                    .HasMaxLength(100);

                entity.Property(e => e.DestinationArrivalTimeUtc)
                    .HasColumnName("destinationArrivalTime_UTC")
                    .HasMaxLength(100);

                entity.Property(e => e.DestinationDepartTimeUtc)
                    .HasColumnName("destinationDepartTime_UTC")
                    .HasMaxLength(100);

                entity.Property(e => e.DestinationPort).HasColumnName("destinationPort");

                entity.Property(e => e.DestinationTerminal)
                    .HasColumnName("destinationTerminal")
                    .HasMaxLength(100);

                entity.Property(e => e.LoadingStatus)
                    .HasColumnName("loadingStatus")
                    .HasMaxLength(100);

                entity.Property(e => e.NextVoyage)
                    .HasColumnName("nextVoyage")
                    .HasMaxLength(100);

                entity.Property(e => e.Operator)
                    .HasColumnName("operator")
                    .HasMaxLength(100);

                entity.Property(e => e.OriginArrivalTimeUtc)
                    .HasColumnName("originArrivalTime_UTC")
                    .HasMaxLength(100);

                entity.Property(e => e.OriginDepartTimeUtc)
                    .HasColumnName("originDepartTime_UTC")
                    .HasMaxLength(100);

                entity.Property(e => e.OriginPort).HasColumnName("originPort");

                entity.Property(e => e.OriginTerminal)
                    .HasColumnName("originTerminal")
                    .HasMaxLength(100);

                entity.Property(e => e.PlannedCruiseSpeedKts).HasColumnName("plannedCruiseSpeed_KTS");

                entity.Property(e => e.PreviousVoyage)
                    .HasColumnName("previousVoyage")
                    .HasMaxLength(100);

                entity.Property(e => e.Route)
                    .HasColumnName("route")
                    .HasMaxLength(100);

                entity.Property(e => e.Ship)
                    .HasColumnName("ship")
                    .HasMaxLength(100);

                entity.Property(e => e.TotalCapacityTeu).HasColumnName("TotalCapacity_TEU");

                entity.Property(e => e.VoyageStatus)
                    .HasColumnName("voyageStatus")
                    .HasMaxLength(100);

                entity.HasOne(d => d.DestinationPortNavigation)
                    .WithMany(p => p.VoyageDestinationPortNavigation)
                    .HasForeignKey(d => d.DestinationPort)
                    .HasConstraintName("FK_Voyage_Port");

                entity.HasOne(d => d.OriginPortNavigation)
                    .WithMany(p => p.VoyageOriginPortNavigation)
                    .HasForeignKey(d => d.OriginPort)
                    .HasConstraintName("FK_Voyage_Port1");
            });

            modelBuilder.Entity<VoyageSlotToken>(entity =>
            {
                entity.ToTable("VoyageSlot_Token");

                entity.Property(e => e.VoyageSlotTokenId)
                    .HasColumnName("voyageSlot_TokenID")
                    .ValueGeneratedNever();

                entity.Property(e => e.InitialBalanceTeu).HasColumnName("initialBalance_TEU");

                entity.Property(e => e.Organisation).HasMaxLength(100);

                entity.Property(e => e.SlotCountBalanceTeu).HasColumnName("SlotCountBalance_TEU");

                entity.Property(e => e.TokensBuyingTeu).HasColumnName("tokensBuying_TEU");

                entity.Property(e => e.TokensPurchasedTeu).HasColumnName("tokensPurchased_TEU");

                entity.Property(e => e.TokensSellingTeu).HasColumnName("tokensSelling_TEU");

                entity.Property(e => e.TokensSoldTeu).HasColumnName("tokensSold_TEU");

                entity.Property(e => e.ValuePurchased).HasColumnName("valuePurchased");

                entity.Property(e => e.ValueSold).HasColumnName("valueSold");

                entity.Property(e => e.Voyage).HasMaxLength(100);
            });
        }
    }
}
