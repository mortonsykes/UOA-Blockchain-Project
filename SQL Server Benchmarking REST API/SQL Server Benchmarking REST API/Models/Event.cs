using System;
using System.Collections.Generic;

namespace SQL_Server_Benchmarking_REST_API.Models
{
    public partial class Event
    {
        public long EventId { get; set; }
        public string Message { get; set; }
        public string Container { get; set; }
        public string Ship { get; set; }
        public string Voyage { get; set; }
    }
}
