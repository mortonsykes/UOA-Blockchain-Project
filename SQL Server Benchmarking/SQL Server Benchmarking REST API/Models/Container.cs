using System;
using System.Collections.Generic;

namespace SQL_Server_Benchmarking_REST_API.Models
{
    public partial class Container
    {
        public long ContainerId { get; set; }
        public string Owner { get; set; }
        public string Carrier { get; set; }
        public bool? IsCustomerSuppliedContainer { get; set; }
        public string ContainerType { get; set; }
        public string ContainerCapacityTeu { get; set; }
        public string ContainerLocationStatus { get; set; }
        public string CurrentContainerYardLocation { get; set; }
        public string CurrentContainerVoyage { get; set; }
        public string IsAvalibleForUse { get; set; }
        public string CurrentJob { get; set; }
    }
}
