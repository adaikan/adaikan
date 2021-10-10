import fs from 'fs-extra';
import sharp from 'sharp';
import path from 'path';

interface Options {
	root: string;
}

const DEFAULT_OPTIONS: Options = {
	root: '',
};

export class PromiseExt<T = any, S = any, I = any> extends Promise<T> {
	static get [Symbol.species]() {
		return Promise;
	}
	public resolver!: (value?: T) => void;
	public rejector!: (error: any) => void;
	public stream: S;
	public instance: I;
	constructor(
		executor?: (
			this: PromiseExt<T, S, I>,
			resolve: (value: T) => void,
			reject: (error: any) => any
		) => void,
		opts?: { stream: S; instance: I }
	) {
		let resolver: any;
		let rejector: any;
		super((resolve, reject) => {
			resolver = resolve;
			rejector = reject;
		});
		executor?.bind(this, resolver, rejector)();
		this.resolver = resolver;
		this.rejector = rejector;
		this.stream = opts?.stream as any;
		this.instance = opts?.instance as any;
	}
}

export class FileStorage {
	static path = path;
	static fs = fs;

	public options: Options;
	constructor(options?: Partial<Options>) {
		this.options = Object.assign({}, DEFAULT_OPTIONS, options);
	}
	public create(options?: Partial<Options>) {
		return new FileStorage(Object.assign({}, this.options, options));
	}
	public async init() {
		await fs.mkdir(this.options.root, { recursive: true });
	}
	public saveImage(
		source: NodeJS.ReadableStream,
		opts: { dirname: string; filename: string }
	) {
		const dir = path.join(this.options.root, opts.dirname);
		const file = path.join(dir, opts.filename);

		return new PromiseExt<any, fs.WriteStream, this>(async function () {
			await fs.emptyDir(dir);

			this.stream = source
				.pipe(sharp())
				.pipe(sharp())
				.resize({ width: 150, height: 150, fit: 'cover', position: 'centre' })
				.webp({ lossless: true })
				.pipe(fs.createWriteStream(file));
			this.stream.on('finish', () => {
				this.resolver();
			});
		});
	}
	public loadImage() {}
}
