using System;
using System.Collections.Generic;

namespace SQL_Server_Benchmarking_REST_API.Models
{
    public partial class VoyageSlotToken
    {
        public long VoyageSlotTokenId { get; set; }
        public double? SlotCountBalanceTeu { get; set; }
        public double? InitialBalanceTeu { get; set; }
        public double? TokensPurchasedTeu { get; set; }
        public double? TokensBuyingTeu { get; set; }
        public double? TokensSoldTeu { get; set; }
        public double? TokensSellingTeu { get; set; }
        public double? ValueSold { get; set; }
        public double? ValuePurchased { get; set; }
        public string Voyage { get; set; }
        public string Organisation { get; set; }
    }
}
