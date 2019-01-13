using System;
using System.Collections.Generic;

namespace SQL_Server_Benchmarking_REST_API.Models
{
    public partial class SlotTokenBuyOrder
    {
        public long SlotTokenBuyOrderId { get; set; }
        public string Buyer { get; set; }
        public string Voyage { get; set; }
        public string BuyerToken { get; set; }
        public double? ContainerSlotQuantityTeu { get; set; }
        public double? BuyPriceLimit { get; set; }
        public string CreatedByUser { get; set; }
        public string LastModifiedByUser { get; set; }
        public string Created { get; set; }
        public string LastModified { get; set; }
        public string Status { get; set; }
    }
}
