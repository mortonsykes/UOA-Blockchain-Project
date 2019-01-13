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
    public class CarrierEmployeesController : ControllerBase
    {
        private readonly ShippingAllianceContext _context;

        public CarrierEmployeesController(ShippingAllianceContext context)
        {
            _context = context;
        }

        // GET: api/CarrierEmployees
        [HttpGet]
        public IEnumerable<CarrierEmployee> GetCarrierEmployee()
        {
            return _context.CarrierEmployee;
        }

        // GET: api/CarrierEmployees/5
        [HttpGet("{id}")]
        public async Task<IActionResult> GetCarrierEmployee([FromRoute] long id)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var carrierEmployee = await _context.CarrierEmployee.FindAsync(id);

            if (carrierEmployee == null)
            {
                return NotFound();
            }

            return Ok(carrierEmployee);
        }

        // PUT: api/CarrierEmployees/5
        [HttpPut("{id}")]
        public async Task<IActionResult> PutCarrierEmployee([FromRoute] long id, [FromBody] CarrierEmployee carrierEmployee)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            if (id != carrierEmployee.UserId)
            {
                return BadRequest();
            }

            _context.Entry(carrierEmployee).State = EntityState.Modified;

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!CarrierEmployeeExists(id))
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

        // POST: api/CarrierEmployees
        [HttpPost]
        public async Task<IActionResult> PostCarrierEmployee([FromBody] CarrierEmployee carrierEmployee)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            _context.CarrierEmployee.Add(carrierEmployee);
            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateException)
            {
                if (CarrierEmployeeExists(carrierEmployee.UserId))
                {
                    return new StatusCodeResult(StatusCodes.Status409Conflict);
                }
                else
                {
                    throw;
                }
            }

            return CreatedAtAction("GetCarrierEmployee", new { id = carrierEmployee.UserId }, carrierEmployee);
        }

        // DELETE: api/CarrierEmployees/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteCarrierEmployee([FromRoute] long id)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var carrierEmployee = await _context.CarrierEmployee.FindAsync(id);
            if (carrierEmployee == null)
            {
                return NotFound();
            }

            _context.CarrierEmployee.Remove(carrierEmployee);
            await _context.SaveChangesAsync();

            return Ok(carrierEmployee);
        }

        private bool CarrierEmployeeExists(long id)
        {
            return _context.CarrierEmployee.Any(e => e.UserId == id);
        }
    }
}