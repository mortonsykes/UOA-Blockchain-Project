using System;
using System.Collections.Generic;

namespace SQL_Server_Benchmarking_REST_API.Models
{
    public partial class Voyage
    {
        public long VoyageId { get; set; }
        public string Ship { get; set; }
        public string Operator { get; set; }
        public string Contract { get; set; }
        public string Route { get; set; }
        public long? OriginPort { get; set; }
        public string OriginTerminal { get; set; }
        public long? DestinationPort { get; set; }
        public string DestinationTerminal { get; set; }
        public string OriginArrivalTimeUtc { get; set; }
        public string OriginDepartTimeUtc { get; set; }
        public string DestinationArrivalTimeUtc { get; set; }
        public string DestinationDepartTimeUtc { get; set; }
        public string ActualOriginArrivalTimeUtc { get; set; }
        public string ActualOriginDepartTimeUtc { get; set; }
        public string ActualDestinationArrivalTimeUtc { get; set; }
        public string ActualDestinationDepartTimeUtc { get; set; }
        public double? PlannedCruiseSpeedKts { get; set; }
        public string VoyageStatus { get; set; }
        public string LoadingStatus { get; set; }
        public string NextVoyage { get; set; }
        public string PreviousVoyage { get; set; }
        public double? TotalCapacityTeu { get; set; }
        public double? BookedCapacityTeu { get; set; }

        public Port DestinationPortNavigation { get; set; }
        public Port OriginPortNavigation { get; set; }
    }
}
