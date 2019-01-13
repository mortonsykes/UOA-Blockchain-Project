using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace SQL_Server_Benchmarking_REST_API.Models
{
    public partial class TransactionHistory
    {
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public long Id { get; set; }
        public string Participant { get; set; }
        public string Transaction { get; set; }
        public string Date { get; set; }
        public string Identity { get; set; }
    }
}
