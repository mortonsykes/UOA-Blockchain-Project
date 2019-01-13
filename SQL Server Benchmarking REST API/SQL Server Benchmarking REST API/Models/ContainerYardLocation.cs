using System;
using System.Collections.Generic;

namespace SQL_Server_Benchmarking_REST_API.Models
{
    public partial class ContainerYardLocation
    {
        public long ContainerYardLocationId { get; set; }
        public string Address { get; set; }
        public string Organisation { get; set; }
        public string ClosistPort { get; set; }
        public string IsSharedYard { get; set; }
        public string IdleContainers { get; set; }
    }
}
