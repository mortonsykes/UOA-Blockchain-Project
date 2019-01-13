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
    public class SlotTokenBuyOrdersController : ControllerBase
    {
        private readonly ShippingAllianceContext _context;

        public SlotTokenBuyOrdersController(ShippingAllianceContext context)
        {
            _context = context;
        }

        // GET: api/SlotTokenBuyOrders
        [HttpGet]
        public IEnumerable<SlotTokenBuyOrder> GetSlotTokenBuyOrder()
        {
            return _context.SlotTokenBuyOrder;
        }

        // GET: api/SlotTokenBuyOrders/5
        [HttpGet("{id}")]
        public async Task<IActionResult> GetSlotTokenBuyOrder([FromRoute] long id)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var slotTokenBuyOrder = await _context.SlotTokenBuyOrder.FindAsync(id);

            if (slotTokenBuyOrder == null)
            {
                return NotFound();
            }

            return Ok(slotTokenBuyOrder);
        }

        // PUT: api/SlotTokenBuyOrders/5
        [HttpPut("{id}")]
        public async Task<IActionResult> PutSlotTokenBuyOrder([FromRoute] long id, [FromBody] SlotTokenBuyOrder slotTokenBuyOrder)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            if (id != slotTokenBuyOrder.SlotTokenBuyOrderId)
            {
                return BadRequest();
            }

            _context.Entry(slotTokenBuyOrder).State = EntityState.Modified;
            _context.TransactionHistory.Add(new TransactionHistory
            {
                Id = slotTokenBuyOrder.SlotTokenBuyOrderId + 70000,
                Date = DateTime.Now.ToLongTimeString(),
                Identity = slotTokenBuyOrder.LastModifiedByUser,
                Participant = slotTokenBuyOrder.LastModifiedByUser,
                Transaction = "PutSlotTokenBuyOrder"
            });
            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!SlotTokenBuyOrderExists(id))
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

        // POST: api/SlotTokenBuyOrders
        [HttpPost]
        public async Task<IActionResult> PostSlotTokenBuyOrder([FromBody] SlotTokenBuyOrder slotTokenBuyOrder)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            _context.SlotTokenBuyOrder.Add(slotTokenBuyOrder);
            _context.TransactionHistory.Add(new TransactionHistory
            {
                Id = slotTokenBuyOrder.SlotTokenBuyOrderId,
                Date = DateTime.Now.ToLongTimeString(),
                Identity = slotTokenBuyOrder.LastModifiedByUser,
                Participant = slotTokenBuyOrder.LastModifiedByUser,
                Transaction = "PostSlotTokenBuyOrder"
            });
            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateException)
            {
                if (SlotTokenBuyOrderExists(slotTokenBuyOrder.SlotTokenBuyOrderId))
                {
                    return new StatusCodeResult(StatusCodes.Status409Conflict);
                }
                else
                {
                    throw;
                }
            }

            return CreatedAtAction("GetSlotTokenBuyOrder", new { id = slotTokenBuyOrder.SlotTokenBuyOrderId }, slotTokenBuyOrder);
        }

        // DELETE: api/SlotTokenBuyOrders/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteSlotTokenBuyOrder([FromRoute] long id)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var slotTokenBuyOrder = await _context.SlotTokenBuyOrder.FindAsync(id);
            if (slotTokenBuyOrder == null)
            {
                return NotFound();
            }

            _context.SlotTokenBuyOrder.Remove(slotTokenBuyOrder);
            await _context.SaveChangesAsync();

            return Ok(slotTokenBuyOrder);
        }

        private bool SlotTokenBuyOrderExists(long id)
        {
            return _context.SlotTokenBuyOrder.Any(e => e.SlotTokenBuyOrderId == id);
        }
    }
}