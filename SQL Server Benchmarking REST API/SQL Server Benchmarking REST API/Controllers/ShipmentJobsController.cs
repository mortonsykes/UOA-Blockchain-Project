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
    public class ShipmentJobsController : ControllerBase
    {
        private readonly ShippingAllianceContext _context;

        public ShipmentJobsController(ShippingAllianceContext context)
        {
            _context = context;
        }

        // GET: api/ShipmentJobs
        [HttpGet]
        public IEnumerable<ShipmentJob> GetShipmentJob()
        {
            return _context.ShipmentJob;
        }

        // GET: api/ShipmentJobs/5
        [HttpGet("{id}")]
        public async Task<IActionResult> GetShipmentJob([FromRoute] long id)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var shipmentJob = await _context.ShipmentJob.FindAsync(id);

            if (shipmentJob == null)
            {
                return NotFound();
            }

            return Ok(shipmentJob);
        }

        // PUT: api/ShipmentJobs/5
        [HttpPut("{id}")]
        public async Task<IActionResult> PutShipmentJob([FromRoute] long id, [FromBody] ShipmentJob shipmentJob)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            if (id != shipmentJob.ShipmentJobId)
            {
                return BadRequest();
            }

            _context.Entry(shipmentJob).State = EntityState.Modified;
            _context.TransactionHistory.Add(new TransactionHistory
            {

                Id = shipmentJob.ShipmentJobId + 20000,
                Date = DateTime.Now.ToLongTimeString(),
                Identity = shipmentJob.Carrier,
                Participant = shipmentJob.Carrier,
                Transaction = "PutShipmentJob"
            });

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!ShipmentJobExists(id))
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

        // POST: api/ShipmentJobs
        [HttpPost]
        public async Task<IActionResult> PostShipmentJob([FromBody] ShipmentJob shipmentJob)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            _context.ShipmentJob.Add(shipmentJob);
            _context.TransactionHistory.Add(new TransactionHistory
            {
                Id = shipmentJob.ShipmentJobId + 100000,
                Date = DateTime.Now.ToLongTimeString(),
                Identity = shipmentJob.Carrier,
                Participant = shipmentJob.Carrier,
                Transaction = "PostShipmentJob"
            });

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateException)
            {
                if (ShipmentJobExists(shipmentJob.ShipmentJobId))
                {
                    return new StatusCodeResult(StatusCodes.Status409Conflict);
                }
                else
                {
                    throw;
                }
            }

            return CreatedAtAction("GetShipmentJob", new { id = shipmentJob.ShipmentJobId }, shipmentJob);
        }

        // DELETE: api/ShipmentJobs/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteShipmentJob([FromRoute] long id)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var shipmentJob = await _context.ShipmentJob.FindAsync(id);
            if (shipmentJob == null)
            {
                return NotFound();
            }

            _context.ShipmentJob.Remove(shipmentJob);
            await _context.SaveChangesAsync();

            return Ok(shipmentJob);
        }

        private bool ShipmentJobExists(long id)
        {
            return _context.ShipmentJob.Any(e => e.ShipmentJobId == id);
        }
    }
}