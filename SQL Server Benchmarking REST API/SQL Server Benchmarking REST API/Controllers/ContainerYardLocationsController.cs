using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SQL_Server_Benchmarking_REST_API.Models;

namespace SQL_Server_Benchmarking_REST_API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class ContainerYardLocationsController : ControllerBase
    {
        private readonly ShippingAllianceContext _context;

        public ContainerYardLocationsController(ShippingAllianceContext context)
        {
            _context = context;
        }

        // GET: api/ContainerYardLocations
        [HttpGet]
        public IEnumerable<ContainerYardLocation> GetContainerYardLocation()
        {
            return _context.ContainerYardLocation;
        }

        // GET: api/ContainerYardLocations/5
        [HttpGet("{id}")]
        public async Task<IActionResult> GetContainerYardLocation([FromRoute] long id)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var containerYardLocation = await _context.ContainerYardLocation.FindAsync(id);

            if (containerYardLocation == null)
            {
                return NotFound();
            }

            return Ok(containerYardLocation);
        }

        // PUT: api/ContainerYardLocations/5
        [HttpPut("{id}")]
        public async Task<IActionResult> PutContainerYardLocation([FromRoute] long id, [FromBody] ContainerYardLocation containerYardLocation)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            if (id != containerYardLocation.ContainerYardLocationId)
            {
                return BadRequest();
            }

            _context.Entry(containerYardLocation).State = EntityState.Modified;

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!ContainerYardLocationExists(id))
                {
                    return NotFound();
                }
                else
                {
                    throw;
                }
            }

            return NoContent();
        }

        // POST: api/ContainerYardLocations
        [HttpPost]
        public async Task<IActionResult> PostContainerYardLocation([FromBody] ContainerYardLocation containerYardLocation)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            _context.ContainerYardLocation.Add(containerYardLocation);
            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateException)
            {
                if (ContainerYardLocationExists(containerYardLocation.ContainerYardLocationId))
                {
                    return new StatusCodeResult(StatusCodes.Status409Conflict);
                }
                else
                {
                    throw;
                }
            }

            return CreatedAtAction("GetContainerYardLocation", new { id = containerYardLocation.ContainerYardLocationId }, containerYardLocation);
        }

        // DELETE: api/ContainerYardLocations/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteContainerYardLocation([FromRoute] long id)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var containerYardLocation = await _context.ContainerYardLocation.FindAsync(id);
            if (containerYardLocation == null)
            {
                return NotFound();
            }

            _context.ContainerYardLocation.Remove(containerYardLocation);
            await _context.SaveChangesAsync();

            return Ok(containerYardLocation);
        }

        private bool ContainerYardLocationExists(long id)
        {
            return _context.ContainerYardLocation.Any(e => e.ContainerYardLocationId == id);
        }
    }
}