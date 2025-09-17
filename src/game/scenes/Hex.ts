import { GameObjects, Scene } from 'phaser';

type AxialCoordinate = { q: number; r: number };

export class HexScene extends Scene {

	// Hex grid parameters and derived geometry
	hexSize: number;
	gridRadius: number;
	centerX: number;
	centerY: number;
	hexWidth: number;
	hexHeight: number;
    camera: Phaser.Cameras.Scene2D.Camera;

	// Stored hex polygons
	hexObjects: GameObjects.Polygon[];

	constructor() {
		super({ key: 'HexScene' });
	}

	create(): void {
		const width = this.scale.width;
		const height = this.scale.height;

        this.camera = this.cameras.main;
        // Remove background color to blend with UI
        this.camera.setBackgroundColor('rgba(0,0,0,0)');

		// Hex grid setup - dynamic sizing
		this.gridRadius = 4;
		
		// Calculate optimal hex size to fit the canvas with proper padding
		const hexesAcross = 2 * this.gridRadius + 1; // Number of hexes across
		const padding = 40; // Universal padding from all edges
		const availableWidth = width - (2 * padding); // Account for left and right padding
		const availableHeight = height - (2 * padding); // Account for top and bottom padding
		
		// Calculate hex size based on width constraint
		// Hex grid width = hexesAcross * hexWidth, where hexWidth = sqrt(3) * hexSize
		const maxHexSizeByWidth = availableWidth / (hexesAcross * Math.sqrt(3));
		
		// Calculate hex size based on height constraint
		// Hex grid height calculation: for a radius R grid, the height is approximately (2*R+1) * hexSize * 1.5
		// But we need to be more precise about the actual grid height
		const gridHeightInHexes = 2 * this.gridRadius + 1;
		const maxHexSizeByHeight = availableHeight / (gridHeightInHexes * 1.5);
		
		// Use the smaller constraint to ensure everything fits
		this.hexSize = Math.min(maxHexSizeByWidth, maxHexSizeByHeight);
		this.hexSize = Math.max(this.hexSize, 10); // Minimum size
		this.hexSize = Math.min(this.hexSize, 50); // Maximum size
		
		// Precompute geometry
		this.hexWidth = Math.sqrt(3) * this.hexSize;
		this.hexHeight = 2 * this.hexSize;
		
		// Calculate actual grid dimensions
		const actualGridWidth = hexesAcross * this.hexWidth;
		const actualGridHeight = gridHeightInHexes * this.hexSize * 1.5;
		
		// Center the grid in the available space
		this.centerX = width / 2;
		this.centerY = height / 2;

		// Store all hex objects
		this.hexObjects = [];

		const hexes = this.generateAxialRadius(this.gridRadius);
		hexes.forEach(({ q, r }) => this.createHexObject(q, r));


		// Listen for resize events
		this.scale.on('resize', this.handleResize, this);
	}

	handleResize(gameSize: any): void {
		const width = gameSize.width;
		const height = gameSize.height;

		// Recalculate hex size for new dimensions using the same logic as create()
		const hexesAcross = 2 * this.gridRadius + 1;
		const padding = 40;
		const availableWidth = width - (2 * padding);
		const availableHeight = height - (2 * padding);
		
		const maxHexSizeByWidth = availableWidth / (hexesAcross * Math.sqrt(3));
		const gridHeightInHexes = 2 * this.gridRadius + 1;
		const maxHexSizeByHeight = availableHeight / (gridHeightInHexes * 1.5);
		
		const newHexSize = Math.min(maxHexSizeByWidth, maxHexSizeByHeight);
		const clampedHexSize = Math.max(Math.min(newHexSize, 50), 10);

		// Only rebuild if the size change is significant
		if (Math.abs(clampedHexSize - this.hexSize) > 2) {
			this.hexSize = clampedHexSize;
			this.hexWidth = Math.sqrt(3) * this.hexSize;
			this.hexHeight = 2 * this.hexSize;
			
			// Center the grid properly
			this.centerX = width / 2;
			this.centerY = height / 2;

			// Clear existing hexes
			this.hexObjects.forEach(hex => hex.destroy());
			this.hexObjects = [];

			// Recreate hexes with new size
			const hexes = this.generateAxialRadius(this.gridRadius);
			hexes.forEach(({ q, r }) => this.createHexObject(q, r));
		}
	}

	generateAxialRadius(radius: number): AxialCoordinate[] {
		const out: AxialCoordinate[] = [];
		for (let q = -radius; q <= radius; q++) {
			for (let r = -radius; r <= radius; r++) {
				const x = q, z = r, y = -x - z;
				const dist = (Math.abs(x) + Math.abs(y) + Math.abs(z)) / 2;
				if (dist <= radius) out.push({ q, r });
			}
		}
		return out;
	}

	axialToPixel(q: number, r: number): { x: number; y: number } {
		const x = this.hexSize * Math.sqrt(3) * (q + r / 2) + this.centerX;
		const y = (this.hexSize * 3) / 2 * r + this.centerY;
		return { x, y };
	}

	polygonPoints(cx: number, cy: number): number[] {
		const pts: number[] = [];
		for (let i = 0; i < 6; i++) {
			const angle_deg = 60 * i - 30;
			const angle_rad = Phaser.Math.DegToRad(angle_deg);
			const px = cx + this.hexSize * Math.cos(angle_rad);
			const py = cy + this.hexSize * Math.sin(angle_rad);
			pts.push(px, py); // flat array (x1,y1,x2,y2,...)
		}
		return pts;
	}

	createHexObject(q: number, r: number): void {
		const { x, y } = this.axialToPixel(q, r);

		// Generate RELATIVE points (centered at 0,0 not at x,y)
		const points: { x: number; y: number }[] = [];
		for (let i = 0; i < 6; i++) {
			const angle_deg = 60 * i - 30;
			const angle_rad = Phaser.Math.DegToRad(angle_deg);
			points.push({
				x: this.hexSize * Math.cos(angle_rad),
				y: this.hexSize * Math.sin(angle_rad)
			});
		}

		// Now points are relative → polygon is correctly centered at (x,y)
		const hex = this.add
			.polygon(x, y, points, 0x1e90ff, 0.3)
			.setStrokeStyle(2, 0x888888)
			.setInteractive(new Phaser.Geom.Polygon(points), Phaser.Geom.Polygon.Contains) as GameObjects.Polygon;

		hex.setData({ q, r, selected: false });

		hex.on('pointerdown', () => {
			const selected = Boolean(hex.getData('selected'));
			hex.setFillStyle(selected ? 0x1e90ff : 0xffcc00, selected ? 0.3 : 0.8);
			hex.setData('selected', !selected);
		});

		hex.on('pointerover', () => {
			hex.setStrokeStyle(3, 0xffffff);
            hex.setDepth(1)
		});
		hex.on('pointerout', () => {
            hex.setStrokeStyle(2, 0x888888)
            hex.setDepth(0)
        });

		this.hexObjects.push(hex);
	}

}
