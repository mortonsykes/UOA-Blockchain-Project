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
    public class VoyagesController : ControllerBase
    {
        private readonly ShippingAllianceContext _context;

        public VoyagesController(ShippingAllianceContext context)
        {
            _context = context;
        }

        // GET: api/Voyages
        [HttpGet]
        public IEnumerable<Voyage> GetVoyage()
        {
            return _context.Voyage;
        }

        // GET: api/Voyages/5
        [HttpGet("{id}")]
        public async Task<IActionResult> GetVoyage([FromRoute] long id)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var voyage = await _context.Voyage.FindAsync(id);

            if (voyage == null)
            {
                return NotFound();
            }

            return Ok(voyage);
        }

        // PUT: api/Voyages/5
        [HttpPut("{id}")]
        public async Task<IActionResult> PutVoyage([FromRoute] long id, [FromBody] Voyage voyage)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            if (id != voyage.VoyageId)
            {
                return BadRequest();
            }

            _context.Entry(voyage).State = EntityState.Modified;

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!VoyageExists(id))
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

        // POST: api/Voyages
        [HttpPost]
        public async Task<IActionResult> PostVoyage([FromBody] Voyage voyage)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            _context.Voyage.Add(voyage);
            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateException)
            {
                if (VoyageExists(voyage.VoyageId))
                {
                    return new StatusCodeResult(StatusCodes.Status409Conflict);
                }
                else
                {
                    throw;
                }
            }

            return CreatedAtAction("GetVoyage", new { id = voyage.VoyageId }, voyage);
        }

        // DELETE: api/Voyages/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteVoyage([FromRoute] long id)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var voyage = await _context.Voyage.FindAsync(id);
            if (voyage == null)
            {
                return NotFound();
            }

            _context.Voyage.Remove(voyage);
            await _context.SaveChangesAsync();

            return Ok(voyage);
        }

        private bool VoyageExists(long id)
        {
            return _context.Voyage.Any(e => e.VoyageId == id);
        }
    }
}