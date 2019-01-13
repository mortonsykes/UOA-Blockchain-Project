using System;
using System.Collections.Generic;

namespace SQL_Server_Benchmarking_REST_API.Models
{
    public partial class ShipmentJob
    {
        public long ShipmentJobId { get; set; }
        public string InitialPort { get; set; }
        public string FinalPort { get; set; }
        public string Carrier { get; set; }
        public string CustomerPreferedDepartureDate { get; set; }
        public string CustomerPreferedArrivalDate { get; set; }
        public string QuoteComputedBestVoyages { get; set; }
        public string JobStatus { get; set; }
        public string RecievedPayment { get; set; }
        public string OriginHaulageType { get; set; }
        public string DesinationHaulageType { get; set; }
        public string CarrierHaulagePickupLocation { get; set; }
        public string CarrierHaulageDropoffLocation { get; set; }
        public string CustomerContainer { get; set; }
        public string CreatedByUser { get; set; }
        public string LastModifiedByUser { get; set; }
        public string Created { get; set; }
        public string LastModified { get; set; }
        public string Customer { get; set; }
        public string CustomerId { get; set; }
        public string Container { get; set; }
        public string IsCustomerSuppliedContainer { get; set; }
        public string CustomerLoadGoodsIntoContainerDropoffLocation { get; set; }
        public string CustomerWillDropContainerAtPort { get; set; }
        public string CustomerPreShipingContainerPickupLocation { get; set; }
        public string CustomerWillPickupContainerAtFinalDestination { get; set; }
        public string CustomerContainerFinalDropOffLocation { get; set; }
    }
}
