using System;
using System.Collections.Generic;

namespace SQL_Server_Benchmarking_REST_API.Models
{
    public partial class CarrierEmployee
    {
        public long UserId { get; set; }
        public string FirstName { get; set; }
        public string LastName { get; set; }
        public long? Organisation { get; set; }

        public Organisation OrganisationNavigation { get; set; }
    }
}
