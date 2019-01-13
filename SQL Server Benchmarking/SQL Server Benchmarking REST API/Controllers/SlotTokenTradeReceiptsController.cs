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
    public class SlotTokenTradeReceiptsController : ControllerBase
    {
        private readonly ShippingAllianceContext _context;

        public SlotTokenTradeReceiptsController(ShippingAllianceContext context)
        {
            _context = context;
        }

        // GET: api/SlotTokenTradeReceipts
        [HttpGet]
        public IEnumerable<SlotTokenTradeReceipt> GetSlotTokenTradeReceipt()
        {
            return _context.SlotTokenTradeReceipt;
        }

        // GET: api/SlotTokenTradeReceipts/5
        [HttpGet("{id}")]
        public async Task<IActionResult> GetSlotTokenTradeReceipt([FromRoute] long id)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var slotTokenTradeReceipt = await _context.SlotTokenTradeReceipt.FindAsync(id);

            if (slotTokenTradeReceipt == null)
            {
                return NotFound();
            }

            return Ok(slotTokenTradeReceipt);
        }

        // PUT: api/SlotTokenTradeReceipts/5
        [HttpPut("{id}")]
        public async Task<IActionResult> PutSlotTokenTradeReceipt([FromRoute] long id, [FromBody] SlotTokenTradeReceipt slotTokenTradeReceipt)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            if (id != slotTokenTradeReceipt.SlotTokenTradeReceiptId)
            {
                return BadRequest();
            }

            _context.Entry(slotTokenTradeReceipt).State = EntityState.Modified;

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!SlotTokenTradeReceiptExists(id))
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

        // POST: api/SlotTokenTradeReceipts
        [HttpPost]
        public async Task<IActionResult> PostSlotTokenTradeReceipt([FromBody] SlotTokenTradeReceipt slotTokenTradeReceipt)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            _context.SlotTokenTradeReceipt.Add(slotTokenTradeReceipt);
            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateException)
            {
                if (SlotTokenTradeReceiptExists(slotTokenTradeReceipt.SlotTokenTradeReceiptId))
                {
                    return new StatusCodeResult(StatusCodes.Status409Conflict);
                }
                else
                {
                    throw;
                }
            }

            return CreatedAtAction("GetSlotTokenTradeReceipt", new { id = slotTokenTradeReceipt.SlotTokenTradeReceiptId }, slotTokenTradeReceipt);
        }

        // DELETE: api/SlotTokenTradeReceipts/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteSlotTokenTradeReceipt([FromRoute] long id)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var slotTokenTradeReceipt = await _context.SlotTokenTradeReceipt.FindAsync(id);
            if (slotTokenTradeReceipt == null)
            {
                return NotFound();
            }

            _context.SlotTokenTradeReceipt.Remove(slotTokenTradeReceipt);
            await _context.SaveChangesAsync();

            return Ok(slotTokenTradeReceipt);
        }

        private bool SlotTokenTradeReceiptExists(long id)
        {
            return _context.SlotTokenTradeReceipt.Any(e => e.SlotTokenTradeReceiptId == id);
        }
    }
}