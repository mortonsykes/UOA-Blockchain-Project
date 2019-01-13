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
    public class SlotTokenSellOrdersController : ControllerBase
    {
        private readonly ShippingAllianceContext _context;

        public SlotTokenSellOrdersController(ShippingAllianceContext context)
        {
            _context = context;
        }

        // GET: api/SlotTokenSellOrders
        [HttpGet]
        public IEnumerable<SlotTokenSellOrder> GetSlotTokenSellOrder()
        {
            return _context.SlotTokenSellOrder;
        }

        // GET: api/SlotTokenSellOrders/5
        [HttpGet("{id}")]
        public async Task<IActionResult> GetSlotTokenSellOrder([FromRoute] long id)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var slotTokenSellOrder = await _context.SlotTokenSellOrder.FindAsync(id);

            if (slotTokenSellOrder == null)
            {
                return NotFound();
            }

            return Ok(slotTokenSellOrder);
        }

        // PUT: api/SlotTokenSellOrders/5
        [HttpPut("{id}")]
        public async Task<IActionResult> PutSlotTokenSellOrder([FromRoute] long id, [FromBody] SlotTokenSellOrder slotTokenSellOrder)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            if (id != slotTokenSellOrder.SlotTokenSellOrderId)
            {
                return BadRequest();
            }

            _context.Entry(slotTokenSellOrder).State = EntityState.Modified;

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!SlotTokenSellOrderExists(id))
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

        // POST: api/SlotTokenSellOrders
        [HttpPost]
        public async Task<IActionResult> PostSlotTokenSellOrder([FromBody] SlotTokenSellOrder slotTokenSellOrder)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            _context.SlotTokenSellOrder.Add(slotTokenSellOrder);
            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateException)
            {
                if (SlotTokenSellOrderExists(slotTokenSellOrder.SlotTokenSellOrderId))
                {
                    return new StatusCodeResult(StatusCodes.Status409Conflict);
                }
                else
                {
                    throw;
                }
            }

            return CreatedAtAction("GetSlotTokenSellOrder", new { id = slotTokenSellOrder.SlotTokenSellOrderId }, slotTokenSellOrder);
        }

        // DELETE: api/SlotTokenSellOrders/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteSlotTokenSellOrder([FromRoute] long id)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var slotTokenSellOrder = await _context.SlotTokenSellOrder.FindAsync(id);
            if (slotTokenSellOrder == null)
            {
                return NotFound();
            }

            _context.SlotTokenSellOrder.Remove(slotTokenSellOrder);
            await _context.SaveChangesAsync();

            return Ok(slotTokenSellOrder);
        }

        private bool SlotTokenSellOrderExists(long id)
        {
            return _context.SlotTokenSellOrder.Any(e => e.SlotTokenSellOrderId == id);
        }
    }
}