using System;
using System.Collections.Generic;

namespace SQL_Server_Benchmarking_REST_API.Models
{
    public partial class Terminal
    {
        public long TerminalId { get; set; }
        public string TerminalName { get; set; }
        public string PortName { get; set; }
    }
}
