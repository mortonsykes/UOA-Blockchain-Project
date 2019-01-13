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
    public class PortsController : ControllerBase
    {
        private readonly ShippingAllianceContext _context;

        public PortsController(ShippingAllianceContext context)
        {
            _context = context;
        }

        // GET: api/Ports
        [HttpGet]
        public IEnumerable<Port> GetPort()
        {
            return _context.Port;
        }

        // GET: api/Ports/5
        [HttpGet("{id}")]
        public async Task<IActionResult> GetPort([FromRoute] long id)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var port = await _context.Port.FindAsync(id);

            if (port == null)
            {
                return NotFound();
            }

            return Ok(port);
        }

        // PUT: api/Ports/5
        [HttpPut("{id}")]
        public async Task<IActionResult> PutPort([FromRoute] long id, [FromBody] Port port)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            if (id != port.PortId)
            {
                return BadRequest();
            }

            _context.Entry(port).State = EntityState.Modified;

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!PortExists(id))
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

        // POST: api/Ports
        [HttpPost]
        public async Task<IActionResult> PostPort([FromBody] Port port)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            _context.Port.Add(port);
            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateException)
            {
                if (PortExists(port.PortId))
                {
                    return new StatusCodeResult(StatusCodes.Status409Conflict);
                }
                else
                {
                    throw;
                }
            }

            return CreatedAtAction("GetPort", new { id = port.PortId }, port);
        }

        // DELETE: api/Ports/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeletePort([FromRoute] long id)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var port = await _context.Port.FindAsync(id);
            if (port == null)
            {
                return NotFound();
            }

            _context.Port.Remove(port);
            await _context.SaveChangesAsync();

            return Ok(port);
        }

        private bool PortExists(long id)
        {
            return _context.Port.Any(e => e.PortId == id);
        }
    }
}