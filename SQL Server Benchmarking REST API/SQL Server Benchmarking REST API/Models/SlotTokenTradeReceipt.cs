using System;
using System.Collections.Generic;

namespace SQL_Server_Benchmarking_REST_API.Models
{
    public partial class SlotTokenTradeReceipt
    {
        public long SlotTokenTradeReceiptId { get; set; }
        public string Seller { get; set; }
        public string Buyer { get; set; }
        public string Voyage { get; set; }
        public double? ContainerSlotQuantityTeu { get; set; }
        public double? SellMinPriceLimit { get; set; }
        public double? BuyMaxPriceLimit { get; set; }
        public double? TotalDue { get; set; }
        public string IsPaid { get; set; }
        public string Created { get; set; }
        public string BuyOrder { get; set; }
        public string SellOrder { get; set; }
    }
}
