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
    public class VoyageSlotTokensController : ControllerBase
    {
        private readonly ShippingAllianceContext _context;

        public VoyageSlotTokensController(ShippingAllianceContext context)
        {
            _context = context;
        }

        // GET: api/VoyageSlotTokens
        [HttpGet]
        public IEnumerable<VoyageSlotToken> GetVoyageSlotToken()
        {
            return _context.VoyageSlotToken;
        }

        // GET: api/VoyageSlotTokens/5
        [HttpGet("{id}")]
        public async Task<IActionResult> GetVoyageSlotToken([FromRoute] long id)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var voyageSlotToken = await _context.VoyageSlotToken.FindAsync(id);

            if (voyageSlotToken == null)
            {
                return NotFound();
            }

            return Ok(voyageSlotToken);
        }

        // PUT: api/VoyageSlotTokens/5
        [HttpPut("{id}")]
        public async Task<IActionResult> PutVoyageSlotToken([FromRoute] long id, [FromBody] VoyageSlotToken voyageSlotToken)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            if (id != voyageSlotToken.VoyageSlotTokenId)
            {
                return BadRequest();
            }

            _context.Entry(voyageSlotToken).State = EntityState.Modified;

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!VoyageSlotTokenExists(id))
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

        // POST: api/VoyageSlotTokens
        [HttpPost]
        public async Task<IActionResult> PostVoyageSlotToken([FromBody] VoyageSlotToken voyageSlotToken)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            _context.VoyageSlotToken.Add(voyageSlotToken);
            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateException)
            {
                if (VoyageSlotTokenExists(voyageSlotToken.VoyageSlotTokenId))
                {
                    return new StatusCodeResult(StatusCodes.Status409Conflict);
                }
                else
                {
                    throw;
                }
            }

            return CreatedAtAction("GetVoyageSlotToken", new { id = voyageSlotToken.VoyageSlotTokenId }, voyageSlotToken);
        }

        // DELETE: api/VoyageSlotTokens/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteVoyageSlotToken([FromRoute] long id)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var voyageSlotToken = await _context.VoyageSlotToken.FindAsync(id);
            if (voyageSlotToken == null)
            {
                return NotFound();
            }

            _context.VoyageSlotToken.Remove(voyageSlotToken);
            await _context.SaveChangesAsync();

            return Ok(voyageSlotToken);
        }

        private bool VoyageSlotTokenExists(long id)
        {
            return _context.VoyageSlotToken.Any(e => e.VoyageSlotTokenId == id);
        }
    }
}