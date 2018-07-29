import TypeClasses from "./processor";
import { PRIMITIVE_TYPES, BIT_RANGE, NAME_MAP } from "./const";

const has = Object.prototype.hasOwnProperty;

export default class Whisper {
  constructor() {
    this.chain = [];
    this.bitChain = [];
    this.endian = "be";
    this.initialize();
  }

  initialize() {
    this.addPrimitiveType();
    this.addBitType();
  }

  addPrimitiveType() {
    Object.keys(PRIMITIVE_TYPES).forEach(type => {
      this[type.toLowerCase()] = (varName, options) =>
        this.setNextParser(type.toLowerCase(), varName, options);
      const typeWithoutEndian = type.replace(/BE|LE/, "").toLowerCase();
      if (typeof this[typeWithoutEndian] !== "function") {
        this[typeWithoutEndian] = (varName, options) =>
          this.setNextParser(typeWithoutEndian + this.endian, varName, options);
      }
    });
  }

  addBitType() {
    BIT_RANGE.forEach(i => {
      this[`bit${i}`] = (varName, options) => {
        options = options || {};
        options = { ...options, length: i };
        return this.setNextParser("bit", varName, options);
      };
    });
  }

  skip(length, options) {
    if (options && options.assert) {
      throw new Error("assert option on skip is not allowed.");
    }

    return this.setNextParser("skip", "", { length });
  }

  string(varName, options) {
    if (!options.zeroTerminated && !options.length && !options.greedy) {
      throw new Error("Neither length, zeroTerminated, nor greedy is defined for string.");
    }
    if ((options.zeroTerminated || options.length) && options.greedy) {
      throw new Error("Greedy is mutually exclusive with length and zeroTerminated for string.");
    }
    if (options.stripNull && !(options.length || options.greedy)) {
      throw new Error("Length or greedy must be defined if stripNull is defined.");
    }

    options.encoding = options.encoding || "utf8";

    return this.setNextParser("string", varName, options);
  }

  array(varName, options) {
    if (!options.readUntil && !options.length && !options.lengthInBytes) {
      throw new Error("Length option of array is not defined.");
    }
    if (!options.type) {
      throw new Error("Type option of array is not defined.");
    }
    if (typeof options.type === "string" && !has.call(PRIMITIVE_TYPES, NAME_MAP[options.type])) {
      throw new Error(`Specified primitive type ${options.type} is not supported.`);
    }

    return this.setNextParser("array", varName, options);
  }

  nest(varName, options) {
    if (arguments.length === 1 && typeof varName === "object") {
      options = varName;
      varName = null;
    }

    if (!options.type) {
      throw new Error("Type option of nest is not defined.");
    }
    if (!(options.type instanceof Whisper)) {
      throw new Error("Type option of nest must be a Parser object.");
    }
    if (!(options.type instanceof Whisper) && !varName) {
      throw new Error("options.type must be a object if variable name is omitted.");
    }

    return this.setNextParser("nest", varName, options);
  }

  endianess(endianess) {
    switch (endianess.toLowerCase()) {
      case "little":
        this.endian = "le";
        break;
      case "big":
        this.endian = "be";
        break;
      default:
        throw new Error("Invalid endianess: " + endianess);
    }

    return this;
  }

  setNextParser(type, varName, options) {
    if (type === "bit") {
      const lastParser = this.chain[this.chain.length - 1];
      if (lastParser && lastParser.type === "bits") {
        lastParser.bitChain.push({ varName, options });
      } else {
        this.chain.push({ type: "bits", bitChain: [{ varName, options }] });
      }
    } else {
      this.chain.push({ type, varName, options });
    }
    return this;
  }

  decompress(buffer) {
    const input = { buffer, offset: 0, bitOffset: 0 };
    const { result } = this.parse(input, {});
    return result;
  }

  parse(buf, result) {
    for (const item of this.chain) {
      const typeProcessor = new TypeClasses[item.type]({ endian: this.endian });
      typeProcessor.parse(buf, result, item);
    }
    return { buf, result };
  }
}
