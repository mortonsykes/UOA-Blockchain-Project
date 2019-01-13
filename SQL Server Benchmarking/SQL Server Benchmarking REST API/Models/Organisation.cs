using System;
using System.Collections.Generic;

namespace SQL_Server_Benchmarking_REST_API.Models
{
    public partial class Organisation
    {
        public Organisation()
        {
            CarrierEmployee = new HashSet<CarrierEmployee>();
        }

        public long OrganisationId { get; set; }
        public string Name { get; set; }
        public string Alliance { get; set; }

        public ICollection<CarrierEmployee> CarrierEmployee { get; set; }
    }
}
