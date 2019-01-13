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
    public class OrganisationsController : ControllerBase
    {
        private readonly ShippingAllianceContext _context;

        public OrganisationsController(ShippingAllianceContext context)
        {
            _context = context;
        }

        // GET: api/Organisations
        [HttpGet]
        public IEnumerable<Organisation> GetOrganisation()
        {
            return _context.Organisation;
        }

        // GET: api/Organisations/5
        [HttpGet("{id}")]
        public async Task<IActionResult> GetOrganisation([FromRoute] long id)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var organisation = await _context.Organisation.FindAsync(id);

            if (organisation == null)
            {
                return NotFound();
            }

            return Ok(organisation);
        }

        // PUT: api/Organisations/5
        [HttpPut("{id}")]
        public async Task<IActionResult> PutOrganisation([FromRoute] long id, [FromBody] Organisation organisation)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            if (id != organisation.OrganisationId)
            {
                return BadRequest();
            }

            _context.Entry(organisation).State = EntityState.Modified;
            _context.TransactionHistory.Add(new TransactionHistory
            {
                Id = organisation.OrganisationId + 50000,
                Date = DateTime.Now.ToLongTimeString(),
                Identity = organisation.OrganisationId.ToString(),
                Participant = organisation.OrganisationId.ToString(),
                Transaction = "PutOrganisation"
            });

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!OrganisationExists(id))
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

        // POST: api/Organisations
        [HttpPost]
        public async Task<IActionResult> PostOrganisation([FromBody] Organisation organisation)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            _context.Organisation.Add(organisation);
            _context.TransactionHistory.Add(new TransactionHistory
            {
                Id = organisation.OrganisationId + 90000,
                Date = DateTime.Now.ToLongTimeString(),
                Identity = organisation.OrganisationId.ToString(),
                Participant = organisation.OrganisationId.ToString(),
                Transaction = "PostOrganisation"
            });
            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateException)
            {
                if (OrganisationExists(organisation.OrganisationId))
                {
                    return new StatusCodeResult(StatusCodes.Status409Conflict);
                }
                else
                {
                    throw;
                }
            }

            return CreatedAtAction("GetOrganisation", new { id = organisation.OrganisationId }, organisation);
        }

        // DELETE: api/Organisations/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteOrganisation([FromRoute] long id)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var organisation = await _context.Organisation.FindAsync(id);
            if (organisation == null)
            {
                return NotFound();
            }

            _context.Organisation.Remove(organisation);
            await _context.SaveChangesAsync();

            return Ok(organisation);
        }

        private bool OrganisationExists(long id)
        {
            return _context.Organisation.Any(e => e.OrganisationId == id);
        }
    }
}