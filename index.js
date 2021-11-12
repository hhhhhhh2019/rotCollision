const width = 360;
const height = 360;

const cnv = document.getElementById("cnv");
cnv.width = width;
cnv.height = height;

const ctx = cnv.getContext("2d");


const vec = function(x, y) {
	return {x, y};
}

const length = function(v) {
	return (v.x * v.x + v.y * v.y) ** 0.5;
}

const normalize = function(v) {
	if (v.x == 0 && v.y == 0) return v;
	let l = length(v);
	return vec(v.x / l, v.y / l);
}

const rotate = function(v, a) {
	return vec(
		v.x * Math.cos(a) - v.y * Math.sin(a),
		v.x * Math.sin(a) + v.y * Math.cos(a)
	);
}

const swap = function(a,b) {let tmp=a; a=b; b=a;};

const proj4p2x = function(a,b,c,d, angle) {
	let ap = rotate(a, -angle).x;
	let bp = rotate(b, -angle).x;
	let cp = rotate(c, -angle).x;
	let dp = rotate(d, -angle).x;
	
	return [
		Math.min(Math.min(bp, Math.min(cp, dp)), ap),
		Math.max(Math.max(bp, Math.max(cp, dp)), ap),
	];
}

const proj4p2y = function(a,b,c,d, angle) {
	let ap = rotate(a, -angle).y;
	let bp = rotate(b, -angle).y;
	let cp = rotate(c, -angle).y;
	let dp = rotate(d, -angle).y;
	
	return [
		Math.min(Math.min(bp, Math.min(cp, dp)), ap),
		Math.max(Math.max(bp, Math.max(cp, dp)), ap),
	];
}

class Rect {
	constructor(pos, size, angle, vel, color) {
		this.pos = pos;
		this.size = size;
		this.angle = angle;
		this.vel = vel;
		this.color = color;
	}
	
	draw() {
		ctx.save();
		
		ctx.translate(this.pos.x, this.pos.y);
		
		ctx.rotate(this.angle);
		
		ctx.strokeStyle = this.color;
		ctx.lineWidth = 1;
		ctx.strokeRect(-this.size.x / 2, -this.size.y / 2,
					 this.size.x, this.size.y);
		
		ctx.restore();
	}
	
	check_collide(objs) {
		for (let i of objs) {
			if (i == this) continue;
			
			let ap1 = vec(-this.size.x / 2 + this.pos.x - i.pos.x,
						  -this.size.y / 2 + this.pos.y - i.pos.y);
			let ap2 = vec(this.size.x / 2 + this.pos.x - i.pos.x,
						  -this.size.y / 2 + this.pos.y - i.pos.y);
			let ap3 = vec(this.size.x / 2 + this.pos.x - i.pos.x,
						  this.size.y / 2 + this.pos.y - i.pos.y);
			let ap4 = vec(-this.size.x / 2 + this.pos.x - i.pos.x,
						  this.size.y / 2 + this.pos.y - i.pos.y);
			
			let bp1 = vec(-i.size.x / 2 + i.pos.x - this.pos.x,
						  -i.size.y / 2 + i.pos.y - this.pos.y);
			let bp2 = vec(i.size.x / 2 + i.pos.x - this.pos.x,
						  -i.size.y / 2 + i.pos.y - this.pos.y);
			let bp3 = vec(i.size.x / 2 + i.pos.x - this.pos.x,
						  i.size.y / 2 + i.pos.y - this.pos.y);
			let bp4 = vec(-i.size.x / 2 + i.pos.x - this.pos.x,
						  i.size.y / 2 + i.pos.y - this.pos.y);
			
			
			let abx = proj4p2x(ap1, ap2, ap3, ap4, i.angle);
			let aby = proj4p2y(ap1, ap2, ap3, ap4, i.angle);
			
			//abx[0] += this.pos.x - i.pos.x; abx[1] += this.pos.x - i.pos.x;
			//aby[0] += this.pos.y - i.pos.y; aby[1] += this.pos.y - i.pos.y;
			
			let bax = proj4p2x(bp1, bp2, bp3, bp4, this.angle);
			let bay = proj4p2y(bp1, bp2, bp3, bp4, this.angle);
			
			//bax[0] += i.pos.x - this.pos.x; bax[1] += i.pos.x - this.pos.x;
			//bay[0] += i.pos.y - this.pos.y; bay[1] += i.pos.y - this.pos.y;
			
			
			ctx.save();
			
			ctx.translate(this.pos.x, this.pos.y);
			ctx.rotate(this.angle);
			
			ctx.strokeStyle = "green";
			ctx.lineWidth = 1;
			
			ctx.beginPath();
			ctx.moveTo(-50, 0);
			ctx.lineTo(50, 0);
			ctx.stroke();
			
			ctx.strokeStyle = this.color;
			ctx.lineWidth = 2;
			
			ctx.beginPath();
			ctx.moveTo(bax[0], 0);
			ctx.lineTo(bax[1], 0);
			ctx.stroke();
			ctx.restore();

			
			ctx.save();
			ctx.translate(this.pos.x, this.pos.y);
			ctx.rotate(this.angle);
			
			ctx.strokeStyle = "yellow";
			ctx.lineWidth = 0.5;
			
			ctx.beginPath();
			ctx.moveTo(0, -50);
			ctx.lineTo(0, 50);
			ctx.stroke();
			
			ctx.strokeStyle = this.color;
			ctx.lineWidth = 2;
			
			ctx.beginPath();
			ctx.moveTo(0, bay[0]);
			ctx.lineTo(0, bay[1]);
			ctx.stroke();
			ctx.restore();
			
			
			
			/*if (abx[0] > i.size.x / 2 + i.pos.x) continue;
			if (abx[1] < -i.size.x / 2 + i.pos.x) continue;
			if (aby[0] > i.size.y / 2 + i.pos.y) continue;
			if (aby[1] < -i.size.y / 2 + i.pos.y) continue;*/
			
			/*if (bax[0] < -this.size.x / 2 + this.pos.x) continue;
			if (bax[1] > this.size.x / 2 + this.pos.x) continue;*/
			if (bay[0] > this.size.y / 2 + this.pos.y) continue;
			if (bay[1] < -this.size.y / 2 + this.pos.y) continue;
			
			return true;
		}
		
		return false;
	}
	
	move(objs) {
		if (this.check_collide(objs) == true) {
			return;
		}
		
		let vel = rotate(this.vel, this.angle);
		
		this.pos.x += vel.x;
		this.pos.y += vel.y;
	}
}


const objs = [
	new Rect(vec(170,120), vec(10,10), 0, vec(0,0), "red"),
	new Rect(vec(170,180), vec(50,10), 0, vec(0,0), "blue")
];

const update = function() {
	ctx.clearRect(0,0,width,height);
	
	for (let i of objs) {
		i.move(objs);
		i.draw();
	}
	
	objs[0].angle += 0.001;
	
	requestAnimationFrame(update);
}

update();