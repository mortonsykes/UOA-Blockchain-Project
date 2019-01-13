using System;
using System.Collections.Generic;

namespace SQL_Server_Benchmarking_REST_API.Models
{
    public partial class SlotTokenSellOrder
    {
        public long SlotTokenSellOrderId { get; set; }
        public string Seller { get; set; }
        public string SellerToken { get; set; }
        public string Voyage { get; set; }
        public double? ContainerSlotQuantityTeu { get; set; }
        public double? SellPriceLimit { get; set; }
        public string CreatedByUser { get; set; }
        public string LastModifiedByUser { get; set; }
        public string Created { get; set; }
        public string LastModified { get; set; }
        public string Status { get; set; }
    }
}
