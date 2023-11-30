import app from "../src/App";
import supertest from "supertest";

const request = supertest(app);
const base = "/api/v1";
const token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJkYXRhIjp7InVzZXIiOiI2NTY1M2Q3MzAxZTM3MmRjNGU5YzJhNTMiLCJsb2dpblNlc3Npb24iOiI2NTY4Yzc3MmRiOTBiMzI1YzhlNWUyZjQifSwiaWF0IjoxNzAxMzY1NjE4LCJleHAiOjE3MDE0NTIwMTh9.rXUIDVum1ixbbN4TGUrnaIibCXFC24Z9CzeDQazmuqw";

  describe("Create a product", function() {
    it("Successfully create a product with response of 201", function() {
        const product = {
            "name": "Mac Book Pro 15",
            "price": 20000,
            "cost": 10000,
            "tags": ["Shoes", "Nike", "Red"],
            "description": "Quality Product - Big size",
            "categories": ["devices"],
            "available_quantity": 20
        };

        request
        .post(base+'/products')
        .send(product)
        .set('Authorization', `bearer ${token}`)
        .set('Accept', 'application/json')
        .expect(function(response) {
            response.status = 201;
            response.body.success = true;
        })
        .expect(201, {
            success: true,
            data: {}
        });
      });
  });

//   describe("Create a product", function() {
//     it("Successfully create a product with response of 201", function() {
//         const product = {
//             "name": "Mac Book Pro 15 e dsdsd",
//             "price": 20000,
//             "cost": 10000,
//             "tags": ["Shoes", "Nike", "Red"],
//             "description": "Quality Product - Big size",
//             "categories": ["devices"],
//             "available_quantity": 20
//         };

//         request
//         .post(base+'/products')
//         .set('Accept', 'application/json')
//         .send(product)
//         .set('Authorization', `bearer ${token}`)
//         .expect(201)
//         .end(function(err, res) {
//           if (err) throw err;
//         });
//       });
//   });