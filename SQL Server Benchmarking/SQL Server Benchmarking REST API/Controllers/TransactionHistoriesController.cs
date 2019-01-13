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
    public class TransactionHistoriesController : ControllerBase
    {
        private readonly ShippingAllianceContext _context;

        public TransactionHistoriesController(ShippingAllianceContext context)
        {
            _context = context;
        }

        // GET: api/TransactionHistories
        [HttpGet]
        public IEnumerable<TransactionHistory> GetTransactionHistory()
        {
            return _context.TransactionHistory;
        }

        // GET: api/TransactionHistories/5
        [HttpGet("{id}")]
        public async Task<IActionResult> GetTransactionHistory([FromRoute] long id)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var transactionHistory = await _context.TransactionHistory.FindAsync(id);

            if (transactionHistory == null)
            {
                return NotFound();
            }

            return Ok(transactionHistory);
        }

        // PUT: api/TransactionHistories/5
        [HttpPut("{id}")]
        public async Task<IActionResult> PutTransactionHistory([FromRoute] long id, [FromBody] TransactionHistory transactionHistory)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            if (id != transactionHistory.Id)
            {
                return BadRequest();
            }

            _context.Entry(transactionHistory).State = EntityState.Modified;

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!TransactionHistoryExists(id))
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

        // POST: api/TransactionHistories
        [HttpPost]
        public async Task<IActionResult> PostTransactionHistory([FromBody] TransactionHistory transactionHistory)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            _context.TransactionHistory.Add(transactionHistory);
            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateException)
            {
                if (TransactionHistoryExists(transactionHistory.Id))
                {
                    return new StatusCodeResult(StatusCodes.Status409Conflict);
                }
                else
                {
                    throw;
                }
            }

            return CreatedAtAction("GetTransactionHistory", new { id = transactionHistory.Id }, transactionHistory);
        }

        // DELETE: api/TransactionHistories/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteTransactionHistory([FromRoute] long id)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var transactionHistory = await _context.TransactionHistory.FindAsync(id);
            if (transactionHistory == null)
            {
                return NotFound();
            }

            _context.TransactionHistory.Remove(transactionHistory);
            await _context.SaveChangesAsync();

            return Ok(transactionHistory);
        }

        private bool TransactionHistoryExists(long id)
        {
            return _context.TransactionHistory.Any(e => e.Id == id);
        }
    }
}