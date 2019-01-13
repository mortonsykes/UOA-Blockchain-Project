using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using SQL_Server_Benchmarking_REST_API;

namespace SQL_Server_Benchmarking_REST_API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class ValuesController : ControllerBase
    {
        // GET api/values
        [HttpGet]
        public ActionResult<IEnumerable<string>> Get()
        {
            return new string[] { "APIs:", "CarrierEmployee", "Container", "ContainerYardLocation", "Event", "Organisation", "Participant", "Port", "And more ..." };
        }

      
    }
}
