function _encodeOtpParameters(message, bb) {
	// 1) bytes secret = 1
	if (message.secret !== undefined) {
		// Tag for field #1, type=2 (length-delimited) => (1 << 3) | 2 = 10
		writeVarint32(bb, 10);
		// Write the length of 'secret' plus the bytes
		writeVarint32(bb, message.secret.length);
		writeBytes(bb, message.secret);
	}

	// 2) string name = 2
	if (message.name !== undefined) {
		// Tag for field #2, type=2 => (2 << 3) | 2 = 18
		writeVarint32(bb, 18);
		// writeString(...) below handles length + the actual text
		writeString(bb, message.name);
	}

	// 3) string issuer = 3
	if (message.issuer !== undefined) {
		// Tag for field #3, type=2 => (3 << 3) | 2 = 26
		writeVarint32(bb, 26);
		writeString(bb, message.issuer);
	}
}

function _decodeOtpParameters(bb) {
	let message = {};

	end_of_message: while (!isAtEnd(bb)) {
		let tag = readVarint32(bb);

		switch (tag >>> 3) {
			case 0:
				break end_of_message;

			// bytes secret = 1
			case 1: {
				let limit = pushTemporaryLength(bb);
				message.secret = readBytes(bb, bb.limit - bb.offset);
				bb.limit = limit;
				break;
			}

			// string name = 2
			case 2: {
				let length = readVarint32(bb);
				message.name = readString(bb, length);
				break;
			}

			// string issuer = 3
			case 3: {
				let length = readVarint32(bb);
				message.issuer = readString(bb, length);
				break;
			}

			default:
				skipUnknownField(bb, tag & 7);
		}
	}

	return message;
}

export function encodeMigrationPayload(message) {
	let bb = popByteBuffer();
	_encodeMigrationPayload(message, bb);
	return toUint8Array(bb);
}

function _encodeMigrationPayload(message, bb) {
	// repeated OtpParameters otpParameters = 1;
	let array$otpParameters = message.otpParameters;
	if (array$otpParameters !== undefined) {
		for (let value of array$otpParameters) {
			writeVarint32(bb, 10);
			let nested = popByteBuffer();
			_encodeOtpParameters(value, nested);
			writeVarint32(bb, nested.limit);
			writeByteBuffer(bb, nested);
			pushByteBuffer(nested);
		}
	}
}

export function decodeMigrationPayload(binary) {
	return _decodeMigrationPayload(wrapByteBuffer(binary));
}

function _decodeMigrationPayload(bb) {
	let message = {};

	end_of_message: while (!isAtEnd(bb)) {
		let tag = readVarint32(bb);

		switch (tag >>> 3) {
			case 0:
				break end_of_message;

			// repeated OtpParameters otpParameters = 1;
			case 1: {
				let limit = pushTemporaryLength(bb);
				let values = message.otpParameters || (message.otpParameters = []);
				values.push(_decodeOtpParameters(bb));
				bb.limit = limit;
				break;
			}

			default:
				skipUnknownField(bb, tag & 7);
		}
	}

	return message;
}

function pushTemporaryLength(bb) {
	let length = readVarint32(bb);
	let limit = bb.limit;
	bb.limit = bb.offset + length;
	return limit;
}

function skipUnknownField(bb, type) {
	switch (type) {
		case 0:
			while (readByte(bb) & 0x80) {}
			break;
		case 2:
			skip(bb, readVarint32(bb));
			break;
		case 5:
			skip(bb, 4);
			break;
		case 1:
			skip(bb, 8);
			break;
		default:
			throw new Error('Unimplemented type: ' + type);
	}
}

function stringToLong(value) {
	return {
		low: value.charCodeAt(0) | (value.charCodeAt(1) << 16),
		high: value.charCodeAt(2) | (value.charCodeAt(3) << 16),
		unsigned: false,
	};
}

function longToString(value) {
	let low = value.low;
	let high = value.high;
	return String.fromCharCode(low & 0xffff, low >>> 16, high & 0xffff, high >>> 16);
}

// The code below was modified from https://github.com/protobufjs/bytebuffer.js
// which is under the Apache License 2.0.

let f32 = new Float32Array(1);
let f32_u8 = new Uint8Array(f32.buffer);

let f64 = new Float64Array(1);
let f64_u8 = new Uint8Array(f64.buffer);

function intToLong(value) {
	value |= 0;
	return {
		low: value,
		high: value >> 31,
		unsigned: value >= 0,
	};
}

let bbStack = [];

function popByteBuffer() {
	const bb = bbStack.pop();
	if (!bb) return { bytes: new Uint8Array(64), offset: 0, limit: 0 };
	bb.offset = bb.limit = 0;
	return bb;
}

function pushByteBuffer(bb) {
	bbStack.push(bb);
}

function wrapByteBuffer(bytes) {
	return { bytes, offset: 0, limit: bytes.length };
}

function toUint8Array(bb) {
	let bytes = bb.bytes;
	let limit = bb.limit;
	return bytes.length === limit ? bytes : bytes.subarray(0, limit);
}

function skip(bb, offset) {
	if (bb.offset + offset > bb.limit) {
		throw new Error('Skip past limit');
	}
	bb.offset += offset;
}

function isAtEnd(bb) {
	return bb.offset >= bb.limit;
}

function grow(bb, count) {
	let bytes = bb.bytes;
	let offset = bb.offset;
	let limit = bb.limit;
	let finalOffset = offset + count;
	if (finalOffset > bytes.length) {
		let newBytes = new Uint8Array(finalOffset * 2);
		newBytes.set(bytes);
		bb.bytes = newBytes;
	}
	bb.offset = finalOffset;
	if (finalOffset > limit) {
		bb.limit = finalOffset;
	}
	return offset;
}

function advance(bb, count) {
	let offset = bb.offset;
	if (offset + count > bb.limit) {
		throw new Error('Read past limit');
	}
	bb.offset += count;
	return offset;
}

function readBytes(bb, count) {
	let offset = advance(bb, count);
	return bb.bytes.subarray(offset, offset + count);
}

function writeBytes(bb, buffer) {
	let offset = grow(bb, buffer.length);
	bb.bytes.set(buffer, offset);
}

function readString(bb, count) {
	// Sadly a hand-coded UTF8 decoder is much faster than subarray+TextDecoder in V8
	let offset = advance(bb, count);
	let fromCharCode = String.fromCharCode;
	let bytes = bb.bytes;
	let invalid = '\uFFFD';
	let text = '';

	for (let i = 0; i < count; i++) {
		let c1 = bytes[i + offset],
			c2,
			c3,
			c4,
			c;

		// 1 byte
		if ((c1 & 0x80) === 0) {
			text += fromCharCode(c1);
		}

		// 2 bytes
		else if ((c1 & 0xe0) === 0xc0) {
			if (i + 1 >= count) text += invalid;
			else {
				c2 = bytes[i + offset + 1];
				if ((c2 & 0xc0) !== 0x80) text += invalid;
				else {
					c = ((c1 & 0x1f) << 6) | (c2 & 0x3f);
					if (c < 0x80) text += invalid;
					else {
						text += fromCharCode(c);
						i++;
					}
				}
			}
		}

		// 3 bytes
		else if ((c1 & 0xf0) == 0xe0) {
			if (i + 2 >= count) text += invalid;
			else {
				c2 = bytes[i + offset + 1];
				c3 = bytes[i + offset + 2];
				if (((c2 | (c3 << 8)) & 0xc0c0) !== 0x8080) text += invalid;
				else {
					c = ((c1 & 0x0f) << 12) | ((c2 & 0x3f) << 6) | (c3 & 0x3f);
					if (c < 0x0800 || (c >= 0xd800 && c <= 0xdfff)) text += invalid;
					else {
						text += fromCharCode(c);
						i += 2;
					}
				}
			}
		}

		// 4 bytes
		else if ((c1 & 0xf8) == 0xf0) {
			if (i + 3 >= count) text += invalid;
			else {
				c2 = bytes[i + offset + 1];
				c3 = bytes[i + offset + 2];
				c4 = bytes[i + offset + 3];
				if (((c2 | (c3 << 8) | (c4 << 16)) & 0xc0c0c0) !== 0x808080) text += invalid;
				else {
					c = ((c1 & 0x07) << 0x12) | ((c2 & 0x3f) << 0x0c) | ((c3 & 0x3f) << 0x06) | (c4 & 0x3f);
					if (c < 0x10000 || c > 0x10ffff) text += invalid;
					else {
						c -= 0x10000;
						text += fromCharCode((c >> 10) + 0xd800, (c & 0x3ff) + 0xdc00);
						i += 3;
					}
				}
			}
		} else text += invalid;
	}

	return text;
}

function writeString(bb, text) {
	// Sadly a hand-coded UTF8 encoder is much faster than TextEncoder+set in V8
	let n = text.length;
	let byteCount = 0;

	// Write the byte count first
	for (let i = 0; i < n; i++) {
		let c = text.charCodeAt(i);
		if (c >= 0xd800 && c <= 0xdbff && i + 1 < n) {
			c = (c << 10) + text.charCodeAt(++i) - 0x35fdc00;
		}
		byteCount += c < 0x80 ? 1 : c < 0x800 ? 2 : c < 0x10000 ? 3 : 4;
	}
	writeVarint32(bb, byteCount);

	let offset = grow(bb, byteCount);
	let bytes = bb.bytes;

	// Then write the bytes
	for (let i = 0; i < n; i++) {
		let c = text.charCodeAt(i);
		if (c >= 0xd800 && c <= 0xdbff && i + 1 < n) {
			c = (c << 10) + text.charCodeAt(++i) - 0x35fdc00;
		}
		if (c < 0x80) {
			bytes[offset++] = c;
		} else {
			if (c < 0x800) {
				bytes[offset++] = ((c >> 6) & 0x1f) | 0xc0;
			} else {
				if (c < 0x10000) {
					bytes[offset++] = ((c >> 12) & 0x0f) | 0xe0;
				} else {
					bytes[offset++] = ((c >> 18) & 0x07) | 0xf0;
					bytes[offset++] = ((c >> 12) & 0x3f) | 0x80;
				}
				bytes[offset++] = ((c >> 6) & 0x3f) | 0x80;
			}
			bytes[offset++] = (c & 0x3f) | 0x80;
		}
	}
}

function writeByteBuffer(bb, buffer) {
	let offset = grow(bb, buffer.limit);
	let from = bb.bytes;
	let to = buffer.bytes;

	// This for loop is much faster than subarray+set on V8
	for (let i = 0, n = buffer.limit; i < n; i++) {
		from[i + offset] = to[i];
	}
}

function readByte(bb) {
	return bb.bytes[advance(bb, 1)];
}

function writeByte(bb, value) {
	let offset = grow(bb, 1);
	bb.bytes[offset] = value;
}

function readFloat(bb) {
	let offset = advance(bb, 4);
	let bytes = bb.bytes;

	// Manual copying is much faster than subarray+set in V8
	f32_u8[0] = bytes[offset++];
	f32_u8[1] = bytes[offset++];
	f32_u8[2] = bytes[offset++];
	f32_u8[3] = bytes[offset++];
	return f32[0];
}

function writeFloat(bb, value) {
	let offset = grow(bb, 4);
	let bytes = bb.bytes;
	f32[0] = value;

	// Manual copying is much faster than subarray+set in V8
	bytes[offset++] = f32_u8[0];
	bytes[offset++] = f32_u8[1];
	bytes[offset++] = f32_u8[2];
	bytes[offset++] = f32_u8[3];
}

function readDouble(bb) {
	let offset = advance(bb, 8);
	let bytes = bb.bytes;

	// Manual copying is much faster than subarray+set in V8
	f64_u8[0] = bytes[offset++];
	f64_u8[1] = bytes[offset++];
	f64_u8[2] = bytes[offset++];
	f64_u8[3] = bytes[offset++];
	f64_u8[4] = bytes[offset++];
	f64_u8[5] = bytes[offset++];
	f64_u8[6] = bytes[offset++];
	f64_u8[7] = bytes[offset++];
	return f64[0];
}

function writeDouble(bb, value) {
	let offset = grow(bb, 8);
	let bytes = bb.bytes;
	f64[0] = value;

	// Manual copying is much faster than subarray+set in V8
	bytes[offset++] = f64_u8[0];
	bytes[offset++] = f64_u8[1];
	bytes[offset++] = f64_u8[2];
	bytes[offset++] = f64_u8[3];
	bytes[offset++] = f64_u8[4];
	bytes[offset++] = f64_u8[5];
	bytes[offset++] = f64_u8[6];
	bytes[offset++] = f64_u8[7];
}

function readInt32(bb) {
	let offset = advance(bb, 4);
	let bytes = bb.bytes;
	return bytes[offset] | (bytes[offset + 1] << 8) | (bytes[offset + 2] << 16) | (bytes[offset + 3] << 24);
}

function writeInt32(bb, value) {
	let offset = grow(bb, 4);
	let bytes = bb.bytes;
	bytes[offset] = value;
	bytes[offset + 1] = value >> 8;
	bytes[offset + 2] = value >> 16;
	bytes[offset + 3] = value >> 24;
}

function readInt64(bb, unsigned) {
	return {
		low: readInt32(bb),
		high: readInt32(bb),
		unsigned,
	};
}

function writeInt64(bb, value) {
	writeInt32(bb, value.low);
	writeInt32(bb, value.high);
}

function readVarint32(bb) {
	let c = 0;
	let value = 0;
	let b;
	do {
		b = readByte(bb);
		if (c < 32) value |= (b & 0x7f) << c;
		c += 7;
	} while (b & 0x80);
	return value;
}

function writeVarint32(bb, value) {
	value >>>= 0;
	while (value >= 0x80) {
		writeByte(bb, (value & 0x7f) | 0x80);
		value >>>= 7;
	}
	writeByte(bb, value);
}

function readVarint64(bb, unsigned) {
	let part0 = 0;
	let part1 = 0;
	let part2 = 0;
	let b;

	b = readByte(bb);
	part0 = b & 0x7f;
	if (b & 0x80) {
		b = readByte(bb);
		part0 |= (b & 0x7f) << 7;
		if (b & 0x80) {
			b = readByte(bb);
			part0 |= (b & 0x7f) << 14;
			if (b & 0x80) {
				b = readByte(bb);
				part0 |= (b & 0x7f) << 21;
				if (b & 0x80) {
					b = readByte(bb);
					part1 = b & 0x7f;
					if (b & 0x80) {
						b = readByte(bb);
						part1 |= (b & 0x7f) << 7;
						if (b & 0x80) {
							b = readByte(bb);
							part1 |= (b & 0x7f) << 14;
							if (b & 0x80) {
								b = readByte(bb);
								part1 |= (b & 0x7f) << 21;
								if (b & 0x80) {
									b = readByte(bb);
									part2 = b & 0x7f;
									if (b & 0x80) {
										b = readByte(bb);
										part2 |= (b & 0x7f) << 7;
									}
								}
							}
						}
					}
				}
			}
		}
	}

	return {
		low: part0 | (part1 << 28),
		high: (part1 >>> 4) | (part2 << 24),
		unsigned,
	};
}

function writeVarint64(bb, value) {
	let part0 = value.low >>> 0;
	let part1 = ((value.low >>> 28) | (value.high << 4)) >>> 0;
	let part2 = value.high >>> 24;

	// ref: src/google/protobuf/io/coded_stream.cc
	let size =
		part2 === 0
			? part1 === 0
				? part0 < 1 << 14
					? part0 < 1 << 7
						? 1
						: 2
					: part0 < 1 << 21
					? 3
					: 4
				: part1 < 1 << 14
				? part1 < 1 << 7
					? 5
					: 6
				: part1 < 1 << 21
				? 7
				: 8
			: part2 < 1 << 7
			? 9
			: 10;

	let offset = grow(bb, size);
	let bytes = bb.bytes;

	switch (size) {
		case 10:
			bytes[offset + 9] = (part2 >>> 7) & 0x01;
		case 9:
			bytes[offset + 8] = size !== 9 ? part2 | 0x80 : part2 & 0x7f;
		case 8:
			bytes[offset + 7] = size !== 8 ? (part1 >>> 21) | 0x80 : (part1 >>> 21) & 0x7f;
		case 7:
			bytes[offset + 6] = size !== 7 ? (part1 >>> 14) | 0x80 : (part1 >>> 14) & 0x7f;
		case 6:
			bytes[offset + 5] = size !== 6 ? (part1 >>> 7) | 0x80 : (part1 >>> 7) & 0x7f;
		case 5:
			bytes[offset + 4] = size !== 5 ? part1 | 0x80 : part1 & 0x7f;
		case 4:
			bytes[offset + 3] = size !== 4 ? (part0 >>> 21) | 0x80 : (part0 >>> 21) & 0x7f;
		case 3:
			bytes[offset + 2] = size !== 3 ? (part0 >>> 14) | 0x80 : (part0 >>> 14) & 0x7f;
		case 2:
			bytes[offset + 1] = size !== 2 ? (part0 >>> 7) | 0x80 : (part0 >>> 7) & 0x7f;
		case 1:
			bytes[offset] = size !== 1 ? part0 | 0x80 : part0 & 0x7f;
	}
}

function readVarint32ZigZag(bb) {
	let value = readVarint32(bb);

	// ref: src/google/protobuf/wire_format_lite.h
	return (value >>> 1) ^ -(value & 1);
}

function writeVarint32ZigZag(bb, value) {
	// ref: src/google/protobuf/wire_format_lite.h
	writeVarint32(bb, (value << 1) ^ (value >> 31));
}

function readVarint64ZigZag(bb) {
	let value = readVarint64(bb, /* unsigned */ false);
	let low = value.low;
	let high = value.high;
	let flip = -(low & 1);

	// ref: src/google/protobuf/wire_format_lite.h
	return {
		low: ((low >>> 1) | (high << 31)) ^ flip,
		high: (high >>> 1) ^ flip,
		unsigned: false,
	};
}

function writeVarint64ZigZag(bb, value) {
	let low = value.low;
	let high = value.high;
	let flip = high >> 31;

	// ref: src/google/protobuf/wire_format_lite.h
	writeVarint64(bb, {
		low: (low << 1) ^ flip,
		high: ((high << 1) | (low >>> 31)) ^ flip,
		unsigned: false,
	});
}
