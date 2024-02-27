/* eslint-disable max-classes-per-file */

// Shape class
class Shape {

    constructor(width, height) {
        this.width = width;
        this.height = height;
    }

    area() {
        return this.width * this.height;
    }

}

// Circle class
class Circle extends Shape {

    constructor(radius) {
        super(radius, radius);
        this.radius = radius;
    }

    area() {
        return Math.PI * (this.radius ** 2);
    }

}

// Rectangle class
class Rectangle extends Shape {

    // eslint-disable-next-line no-useless-constructor
    constructor(width, height) {
        super(width, height);
    }

}

// Main code
const shapes = [];

const c = new Circle(5);
shapes.push(c);

const r = new Rectangle(3, 4);
shapes.push(r);

for (const s of shapes) {
    console.log(s.area());
}

// eslint-disable-next-line no-var, no-unused-vars, vars-on-top
var oldVariableDeclaration = 'Alice';
