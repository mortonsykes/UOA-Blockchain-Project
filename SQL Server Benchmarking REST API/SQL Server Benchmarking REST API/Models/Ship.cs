using System;
using System.Collections.Generic;

namespace SQL_Server_Benchmarking_REST_API.Models
{
    public partial class Ship
    {
        public long ShipId { get; set; }
        public string ShipName { get; set; }
        public string Owner { get; set; }
        public string Operator { get; set; }
        public string CallSign { get; set; }
        public string ContainerCapacityTeu { get; set; }
        public string CurrentVoyage { get; set; }
    }
}
