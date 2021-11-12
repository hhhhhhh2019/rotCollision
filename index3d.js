const width = 720;
const height = 480;

const cnv = document.getElementById("cnv");
cnv.width = width;
cnv.height = height;

const gl = cnv.getContext("webgl2");

gl.viewport(0, 0, width, height);

gl.enable(gl.DEPTH_TEST);
gl.depthFunc(gl.LESS);


const matrix = function(a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p) {
	return [
		a, e, i, m,
		b, f, j, n,
		c, g, k, o,
		d, h, l, p
	];
}

const makeProjMatrix = function(angle, near, far, asp) {
	var f = 1.0 / Math.tan(angle / 2);
	var rangeInv = 1 / (near - far);

	return [
		f / asp, 0, 0, 0,
		0, f, 0, 0,
		0, 0, (near + far) * rangeInv, -1,
		0, 0, near * far * rangeInv * 2, 0
	];
}

const makeRotMatrix = function(a) {
	let bx = vec(1,0,0);
	let by = vec(0,1,0);
	let bz = vec(0,0,1);

	bx = rotateX(bx, a.x); bx = rotateY(bx, a.y); bx = rotateZ(bx, a.z);
	by = rotateX(by, a.x); by = rotateY(by, a.y); by = rotateZ(by, a.z);
	bz = rotateX(bz, a.x); bz = rotateY(bz, a.y); bz = rotateZ(bz, a.z);

	return matrix(
		bx.x, bx.y, bx.z, 0,
		by.x, by.y, by.z, 0,
		bz.x, bz.y, bz.z, 0,
		0, 0, 0, 1
	)
}


const vec = function(x, y=x, z=x, w) {
	return {x: x || 0, y: y || 0, z: z || 0, w: w || 0};
}

const length = function(v) {
	return (v.x * v.x + v.y * v.y + v.z * v.z) ** 0.5;
}

const normalize = function(v) {
	if (v.x == 0 && v.y == 0) return v;
	let l = length(v);
	return vec(v.x / l, v.y / l, v.z / l);
}

const rotateX = function(v, a) {
	return vec(
		v.x,
		v.y * Math.cos(a) - v.z * Math.sin(a),
		v.y * Math.sin(a) + v.z * Math.cos(a)
	);
}

const rotateY = function(v, a) {
	return vec(
		v.x * Math.cos(a) - v.z * Math.sin(a),
		v.y,
		v.x * Math.sin(a) + v.z * Math.cos(a)
	);
}

const rotateZ = function(v, a) {
	return vec(
		v.x * Math.cos(a) - v.y * Math.sin(a),
		v.x * Math.sin(a) + v.y * Math.cos(a),
		v.z
	);
}


const sum = function(a, b) {return vec(a.x + b.x, a.y + b.y, a.z + b.z)};
const sub = function(a, b) {return vec(a.x - b.x, a.y - b.y, a.z - b.z)};
const mul = function(a, b) {return vec(a.x * b.x, a.y * b.y, a.z * b.z)};
const div = function(a, b) {return vec(a.x / b.x, a.y / b.y, a.z / b.z)};

const dot = function(a, b) {
	return a.x * b.x + a.y * b.y + a.z * b.z;
}


const setUniform = function(prog, unif, value, type) {
	const uniform = gl.getUniformLocation(prog, unif);
	
	if (type == "int")
		gl.uniform1i(uniform, value);
	else if (type == "float")
		gl.uniform1f(uniform, value)
	else if (type == "vec2")
		gl.uniform2f(uniform, value.x, value.y);
	else if (type == "vec3")
		gl.uniform3f(uniform, value.x, value.y, value.z);
	else if (type == "vec4")
		gl.uniform4f(uniform, value.x, value.y, value.z, value.w);
	else if (type == "mat3")
		gl.uniformMatrix3fv(uniform, false, value);
	else if (type == "mat4")
		gl.uniformMatrix4fv(uniform, false, value);
}


const createShader = function(source, type) {
	let shader = gl.createShader(type);

	gl.shaderSource(shader, source);

	gl.compileShader(shader);

	if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
		alert(gl.getShaderInfoLog(shader));
		return null;
	}

	return shader;
}

const createProgram = function(vert, frag) {
	let program = gl.createProgram();

	gl.attachShader(program, createShader(vert, gl.VERTEX_SHADER));
	gl.attachShader(program, createShader(frag, gl.FRAGMENT_SHADER));

	gl.linkProgram(program);

	if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
		alert(gl.getProgramInfoLog(program));
		return null;
	}

	return program;
}

const vert_shader = `
	attribute vec3 aVertexPosition;

	uniform mat4 projMat;
	uniform mat4 objMvMat;
	uniform mat4 camMvMat;
	uniform mat4 camRotMat;

	void main() {
		gl_Position = projMat * camRotMat * camMvMat * objMvMat * vec4(aVertexPosition, 1);
	}
`;

const frag_shader = `
	precision mediump float;

	uniform vec3 color;

	void main() {
		gl_FragColor = vec4(color,1);
	}
`;

const prog = createProgram(vert_shader, frag_shader);

gl.useProgram(prog);


const proj_mat = makeProjMatrix(Math.PI / 180 * 80, 0.01, 10000, width / height);

setUniform(prog, "projMat", proj_mat, "mat4");


const camSpeed = 0.01;
const camRotSpeed = Math.PI * 0.01;

var camPos = vec(0,0,0.5);
var camRot = vec(0,0,0);

var camPosVel = vec(0,0,0);
var camRotVel = vec(0,0,0);


const isEqual = function(object1, object2) {
	const props1 = Object.getOwnPropertyNames(object1);
	const props2 = Object.getOwnPropertyNames(object2);

	if (props1.length !== props2.length) {
		return false;
	}

	for (let i = 0; i < props1.length; i += 1) {
		const prop = props1[i];

		if (object1[prop] !== object2[prop]) {
		return false;
		}
	}

	return true;
}


const cross = function(a, b) {
    return normalize(vec(a.y * b.z - a.z * b.y, a.z * b.x - a.x * b.z, a.x * b.y - a.y * b.x));
}

const abs = function(v) {return vec(Math.abs(v.x), Math.abs(v.y), Math.abs(v.z))}

const proj2plane = function(p, bx, by) {
	let n = abs(cross(bx, by));

	let v = sub(p, vec(0,0,0));
	let dist = v.x * n.x + v.y * n.y + v.z * n.z;
	let res1 = sub(p, mul(n, vec(dist)));

	//console.log(res1);

	return vec(
		mul(vec(dot(res1, bx)), vec(1,0)).x,
		mul(vec(dot(res1, by)), vec(0,1)).y,
		0,0
	);
}

const proj = function(p, d) {
	return mul(div(
		vec(dot(p, d)),
		vec(dot(d, d))
	), d);
}

const proj8p = function(a, b, c, d, e, f, g, h, bx, by) {
	let ap = proj2plane(a, bx, by);
	let bp = proj2plane(b, bx, by);
	let cp = proj2plane(c, bx, by);
	let dp = proj2plane(d, bx, by);
	let ep = proj2plane(e, bx, by);
	let fp = proj2plane(f, bx, by);
	let gp = proj2plane(g, bx, by);
	let hp = proj2plane(h, bx, by);

	let minx = Math.min(hp.x, Math.min(gp.x, Math.min(fp.x, Math.min(ep.x, Math.min(Math.min(Math.min(ap.x, bp.x), cp.x), dp.x)))));
	let maxx = Math.max(hp.x, Math.max(gp.x, Math.max(fp.x, Math.max(ep.x, Math.max(Math.max(Math.max(ap.x, bp.x), cp.x), dp.x)))));
	let miny = Math.min(hp.y, Math.min(gp.y, Math.min(fp.y, Math.min(ep.y, Math.min(Math.min(Math.min(ap.y, bp.y), cp.y), dp.y)))));
	let maxy = Math.max(hp.y, Math.max(gp.y, Math.max(fp.y, Math.max(ep.y, Math.max(Math.max(Math.max(ap.y, bp.y), cp.y), dp.y)))));

	let res = [];

	for (let i of [ap, bp, cp, dp, ep, fp, gp, hp]) {
		let inRes = false;
		for (let j of res) {if (isEqual(i, j)) inRes = true;};
		if (inRes) continue;
		if (res.length == 4) break;
		if (minx > i.x || i.x > maxx) continue;
		if (miny > i.y || i.y > maxy) continue;
		res.push(i);
	}

	return res;
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

const check_collide = function(a, b) {
	let ap1 = sub(sum(rotateZ(vec(-a.size.x / 2,
									-a.size.y / 2), a.angle.z), a.pos), b.pos);
	let ap2 = sub(sum(rotateZ(vec(a.size.x / 2,
									-a.size.y / 2), a.angle.z), a.pos), b.pos);
	let ap3 = sub(sum(rotateZ(vec(a.size.x / 2,
									a.size.y / 2), a.angle.z), a.pos), b.pos);
	let ap4 = sub(sum(rotateZ(vec(-a.size.x / 2,
									a.size.y / 2), a.angle.z), a.pos), b.pos);
	
	let bp1 = sub(sum(rotateZ(vec(-b.size.x / 2,
							-b.size.y / 2), b.angle.z), b.pos), a.pos);
	let bp2 = sub(sum(rotateZ(vec(i.size.x / 2,
							-b.size.y / 2), b.angle.z), b.pos), a.pos);
	let bp3 = sub(sum(rotateZ(vec(i.size.x / 2,
							b.size.y / 2), b.angle.z), b.pos), a.pos);
	let bp4 = sub(sum(rotateZ(vec(-i.size.x / 2,
							b.size.y / 2), b.angle.z), b.pos), a.pos);
	
	
	let abx = proj4p2x(ap1, ap2, ap3, ap4, b.angle);
	let aby = proj4p2y(ap1, ap2, ap3, ap4, b.angle);
	
	let bax = proj4p2x(bp1, bp2, bp3, bp4, a.angle);
	let bay = proj4p2y(bp1, bp2, bp3, bp4, a.angle);		
	
	
	if (abx[0] > b.size.x / 2) return false;
	if (abx[1] < -b.size.x / 2) return false;
	if (aby[0] > b.size.y / 2) return false;
	if (aby[1] < -b.size.y / 2) return false;
	
	if (bax[0] > a.size.x / 2) return false;
	if (bax[1] < -a.size.x / 2) return false;
	if (bay[0] > a.size.y / 2) return false;
	if (bay[1] < -a.size.y / 2) return false;
	
	return true;
}


class Rect {
	constructor(pos, size, angle, vel, color) {
		this.pos = pos;
		this.size = size;
		this.angle = angle;
		this.vel = vel;
		this.color = color;

		this.vert = [
			-this.size.x / 2, -this.size.y / 2, -this.size.z / 2,
			 this.size.x / 2, -this.size.y / 2, -this.size.z / 2,
			-this.size.x / 2,  this.size.y / 2, -this.size.z / 2,
			 this.size.x / 2,  this.size.y / 2, -this.size.z / 2,

			-this.size.x / 2, -this.size.y / 2,  this.size.z / 2,
			 this.size.x / 2, -this.size.y / 2,  this.size.z / 2,
			-this.size.x / 2,  this.size.y / 2,  this.size.z / 2,
			 this.size.x / 2,  this.size.y / 2,  this.size.z / 2,
		];

		this.faces = [
			0,1,2,
			1,2,3,

			4,5,6,
			5,6,7,

			0,4,6,
			0,6,2,

			7,1,5,
			1,3,7,

			0,4,5,
			0,1,5,

			2,6,7,
			2,3,7
		]
	}

	draw() {
		const mvMat = matrix(
			1,0,0,this.pos.x,
			0,1,0,this.pos.y,
			0,0,1,this.pos.z,
			0,0,0,1
		);

		const camMvMat = matrix(
			1,0,0,-camPos.x,
			0,1,0,-camPos.y,
			0,0,1,-camPos.z,
			0,0,0,1
		);

		const camRotMat = makeRotMatrix(camRot);

		setUniform(prog, "objMvMat", mvMat, "mat4");
		setUniform(prog, "camMvMat", camMvMat, "mat4");
		setUniform(prog, "camRotMat", camRotMat, "mat4");
		setUniform(prog, "color", this.color, "vec3");

		const vertexAttribute = gl.getAttribLocation(prog, 'aVertexPosition');

		gl.enableVertexAttribArray(vertexAttribute);

		const vert_buf = gl.createBuffer();
		gl.bindBuffer(gl.ARRAY_BUFFER, vert_buf);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.vert), gl.STATIC_DRAW);
		gl.vertexAttribPointer(vertexAttribute, 3, gl.FLOAT, false, 0, 0);

		const faces_buf = gl.createBuffer();
		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, faces_buf);
		gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(this.faces), gl.STATIC_DRAW);

		gl.drawElements(gl.TRIANGLES, 12 * 3, gl.UNSIGNED_SHORT, 0);
		gl.flush();
	}

	check_collide(objs) {
		
	}

	move(objs) {
		if (this.check_collide(objs)) return;

		let vel = rotateZ(rotateY(rotateX(this.vel, this.angle.x), this.angle.y), this.angle.z);
		
		this.pos.x += vel.x;
		this.pos.y += vel.y;
		this.pos.z += vel.z;
	}
}


document.onkeydown = function(e) {
	if (e.key == "w") camPosVel.z = -camSpeed;
	else if (e.key == "s") camPosVel.z = camSpeed;

	else if (e.key == "a") camPosVel.x = -camSpeed;
	else if (e.key == "d") camPosVel.x = camSpeed;

	else if (e.key == "q") camPosVel.y = -camSpeed;
	else if (e.key == "e") camPosVel.y = camSpeed;


	if (e.key == "ArrowLeft") camRotVel.y = -camRotSpeed;
	else if (e.key == "ArrowRight") camRotVel.y = camRotSpeed;

	else if (e.key == "ArrowUp") camRotVel.x = camRotSpeed;
	else if (e.key == "ArrowDown") camRotVel.x = -camRotSpeed;
}

document.onkeyup = function(e) {
	if (e.key == "w") camPosVel.z = 0;
	else if (e.key == "s") camPosVel.z = 0;

	else if (e.key == "a") camPosVel.x = 0;
	else if (e.key == "d") camPosVel.x = 0;

	else if (e.key == "q") camPosVel.y = 0;
	else if (e.key == "e") camPosVel.y = 0;

	if (e.key == "ArrowLeft") camRotVel.y = 0;
	else if (e.key == "ArrowRight") camRotVel.y = 0;

	else if (e.key == "ArrowUp") camRotVel.x = 0;
	else if (e.key == "ArrowDown") camRotVel.x = 0;
}


const objs = [
	new Rect(vec(1,0,-1), vec(0.5), vec(0), vec(-0.01,0,0), vec(0,1,0)),
	new Rect(vec(-1,0,-1), vec(0.5), vec(0), vec(0), vec(0,0,1))
]


const update = function() {
	gl.clearColor(0.5, 0.5, 0.5, 1);
	gl.clear(gl.COLOR_BUFFER_BIT);

	gl.clearColor(0, 0, 0, 1);
	gl.clear(gl.DEPTH_BUFFER_BIT);

	let cvel = rotateZ(rotateY(rotateX(camPosVel, camRot.x), camRot.y), camRot.z);

	camPos.x += cvel.x; camPos.y += cvel.y; camPos.z += cvel.z;
	camRot.x += camRotVel.x; camRot.y += camRotVel.y; camRot.z += camRotVel.z;
	
	for (let i of objs) {
		i.move(objs);
		i.draw();
	}
	
	requestAnimationFrame(update);
}

update();