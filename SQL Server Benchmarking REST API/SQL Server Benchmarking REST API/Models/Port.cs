using System;
using System.Collections.Generic;

namespace SQL_Server_Benchmarking_REST_API.Models
{
    public partial class Port
    {
        public Port()
        {
            VoyageDestinationPortNavigation = new HashSet<Voyage>();
            VoyageOriginPortNavigation = new HashSet<Voyage>();
        }

        public long PortId { get; set; }
        public string PortName { get; set; }
        public string Country { get; set; }
        public string City { get; set; }
        public string Terminals { get; set; }

        public ICollection<Voyage> VoyageDestinationPortNavigation { get; set; }
        public ICollection<Voyage> VoyageOriginPortNavigation { get; set; }
    }
}
