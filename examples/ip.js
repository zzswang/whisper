import Whisper from "../src";

const ipHeader = new Whisper()
  .endianess("big")
  .bit4("version")
  .bit4("headerLength")
  .uint8("tos")
  .uint16("packetLength")
  .uint16("id")
  .bit3("offset")
  .bit13("fragOffset")
  .uint8("ttl")
  .uint8("protocol")
  .uint16("checksum")
  .array("src", {
    type: "uint8",
    length: 4
  })
  .array("dst", {
    type: "uint8",
    length: 4
  });

const buf = Buffer.from("450002c5939901002c06ef98adc24f6c850186d1", "hex");

console.log(ipHeader.decompress(buf));

// const tcpHeader = new Whisper()
//   .endianess("big")
//   .uint16("srcPort")
//   .uint16("dstPort")
//   .uint32("seq")
//   .uint32("ack")
//   .bit4("dataOffset")
//   .bit6("reserved")
//   .nest("flags", {
//     type: new Whisper()
//       .bit1("urg")
//       .bit1("ack")
//       .bit1("psh")
//       .bit1("rst")
//       .bit1("syn")
//       .bit1("fin")
//   })
//   .uint16("windowSize")
//   .uint16("checksum")
//   .uint16("urgentPointer");

// const buf = Buffer.from("e8a203e108e177e13d20756b801829d3004100000101080a2ea486ba793310bc", "hex");

// console.log(tcpHeader.decompress(buf));
