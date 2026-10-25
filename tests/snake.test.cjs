const {test}=require('node:test');
const assert=require('node:assert/strict');
const {SnakeGame}=require('../snake.js');
test('food grows the snake and adds a point',()=>{const game=new SnakeGame(()=>0);game.food={x:6,y:8};assert.equal(game.step(),'food');assert.equal(game.body.length,4);assert.equal(game.score,1);assert.ok(!game.body.some(p=>p.x===game.food.x&&p.y===game.food.y));});
test('the snake wraps at edges and cannot reverse into itself',()=>{const game=new SnakeGame(()=>0);game.body=[{x:15,y:8},{x:14,y:8},{x:13,y:8}];game.turn(2);game.step();assert.deepEqual(game.body[0],{x:0,y:8});});
test('self collision restarts the snake and keeps earned points',()=>{const game=new SnakeGame(()=>0);game.score=3;game.body=[{x:5,y:5},{x:5,y:6},{x:4,y:6},{x:4,y:5},{x:4,y:4}];game.direction=3;game.queued=2;assert.equal(game.step(),'collision');assert.equal(game.score,3);assert.equal(game.body.length,3);});
