const width = 480;
const height = 480;

const cnv = document.getElementById("cnv");
cnv.width = width;
cnv.height = height;

const ctx = cnv.getContext("2d");


const vec = function(x, y=x) {
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

const sum = function(a, b) {return vec(a.x + b.x, a.y + b.y)};
const sub = function(a, b) {return vec(a.x - b.x, a.y - b.y)};
const mul = function(a, b) {return vec(a.x * b.x, a.y * b.y)};
const div = function(a, b) {return vec(a.x / b.x, a.y / b.y)};

const dot = function(a, b) {
	return a.x * b.x + a.y * b.y;
}

const proj = function(p, d) {
	//D = A + AB * Dot(AC, AB) / Dot(AB, AB)
	//D = d * dot(p, d) / dot(d, d);

	return mul(div(
		vec(dot(p, d)),
		vec(dot(d, d))
	), d);

	//return sum(vec(0,0), div(mul(d, vec(dot(p, d))), vec(dot(d, d))));
}

const proj4p2x = function(a,b,c,d, angle) {
	let axis = rotate(vec(1,0), angle);

	let ap = rotate(proj(a, axis), -angle).x;
	let bp = rotate(proj(b, axis), -angle).x;
	let cp = rotate(proj(c, axis), -angle).x;
	let dp = rotate(proj(d, axis), -angle).x;
	
	return [
		Math.min(Math.min(bp, Math.min(cp, dp)), ap),
		Math.max(Math.max(bp, Math.max(cp, dp)), ap),
	];
}

const proj4p2y = function(a,b,c,d, angle) {
	let axis = rotate(vec(0,1), angle);

	let ap = rotate(proj(a, axis), -angle).y;
	let bp = rotate(proj(b, axis), -angle).y;
	let cp = rotate(proj(c, axis), -angle).y;
	let dp = rotate(proj(d, axis), -angle).y;
	
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
		ctx.lineWidth = 2;
		ctx.strokeRect(-this.size.x / 2, -this.size.y / 2,
					 this.size.x, this.size.y);
		
		ctx.restore();
	}
	
	check_collide(objs) {
		for (let i of objs) {
			if (i == this) continue;
			
			let ap1 = sub(sum(rotate(vec(-this.size.x / 2,
										 -this.size.y / 2), this.angle), this.pos), i.pos);
			let ap2 = sub(sum(rotate(vec(this.size.x / 2,
										 -this.size.y / 2), this.angle), this.pos), i.pos);
			let ap3 = sub(sum(rotate(vec(this.size.x / 2,
										 this.size.y / 2), this.angle), this.pos), i.pos);
			let ap4 = sub(sum(rotate(vec(-this.size.x / 2,
										 this.size.y / 2), this.angle), this.pos), i.pos);
			
			let bp1 = sub(sum(rotate(vec(-i.size.x / 2,
								 -i.size.y / 2), i.angle), i.pos), this.pos);
			let bp2 = sub(sum(rotate(vec(i.size.x / 2,
								 -i.size.y / 2), i.angle), i.pos), this.pos);
			let bp3 = sub(sum(rotate(vec(i.size.x / 2,
								 i.size.y / 2), i.angle), i.pos), this.pos);
			let bp4 = sub(sum(rotate(vec(-i.size.x / 2,
								 i.size.y / 2), i.angle), i.pos), this.pos);
			
			
			let abx = proj4p2x(ap1, ap2, ap3, ap4, i.angle);
			let aby = proj4p2y(ap1, ap2, ap3, ap4, i.angle);
			
			let bax = proj4p2x(bp1, bp2, bp3, bp4, this.angle);
			let bay = proj4p2y(bp1, bp2, bp3, bp4, this.angle);		
			
			
			if (abx[0] > i.size.x / 2) continue;
			if (abx[1] < -i.size.x / 2) continue;
			if (aby[0] > i.size.y / 2) continue;
			if (aby[1] < -i.size.y / 2) continue;
			
			if (bax[0] > this.size.x / 2) continue;
			if (bax[1] < -this.size.x / 2) continue;
			if (bay[0] > this.size.y / 2) continue;
			if (bay[1] < -this.size.y / 2) continue;
			
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
	new Rect(vec(120,120), vec(20,20), -Math.PI / 4, vec(0,1), "red"),
	new Rect(vec(170,180), vec(90,20), -Math.PI / 3, vec(0,0), "blue")
];

const update = function() {
	ctx.clearRect(0,0,width,height);
	
	for (let i of objs) {
		i.move(objs);
		i.draw();
	}
	
	requestAnimationFrame(update);
}

update();