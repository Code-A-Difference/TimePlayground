/* Shared game rules for the browser and Node checks. */
(function(root){
  const directions=[[1,0],[0,1],[-1,0],[0,-1]];
  class SnakeGame{
    constructor(random=Math.random){this.random=random;this.size=16;this.score=0;this.reset();}
    reset(){this.body=[{x:5,y:8},{x:4,y:8},{x:3,y:8}];this.direction=0;this.queued=0;this.placeFood();}
    placeFood(){const free=[];for(let y=0;y<this.size;y++)for(let x=0;x<this.size;x++)if(!this.body.some(p=>p.x===x&&p.y===y))free.push({x,y});this.food=free.length?free[Math.min(free.length-1,Math.floor(this.random()*free.length))]:null;}
    turn(next){if(Number.isInteger(next)&&next>=0&&next<4&&next!==(this.direction+2)%4)this.queued=next;}
    clockwise(){this.turn((this.direction+1)%4);}
    step(){
      this.direction=this.queued;
      const [dx,dy]=directions[this.direction],head=this.body[0];
      const next={x:(head.x+dx+this.size)%this.size,y:(head.y+dy+this.size)%this.size};
      const eats=this.food&&next.x===this.food.x&&next.y===this.food.y;
      const occupied=eats?this.body:this.body.slice(0,-1);
      if(occupied.some(p=>p.x===next.x&&p.y===next.y)){this.reset();return 'collision';}
      this.body.unshift(next);
      if(eats){this.score++;this.placeFood();if(!this.food){this.reset();return 'filled';}return 'food';}
      this.body.pop();return 'move';
    }
  }
  if(typeof module!=='undefined'&&module.exports)module.exports={SnakeGame};
  else root.SnakeGame=SnakeGame;
})(typeof window!=='undefined'?window:globalThis);
