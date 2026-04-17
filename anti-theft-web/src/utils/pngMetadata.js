/**
 * PNG 元数据处理工具
 *
 * 功能：
 * - 从 PNG 文件中读取角色卡元数据（JSON）
 * - 将修改后的元数据写回 PNG 文件
 * - 支持 SillyTavern 角色卡格式
 *
 * SillyTavern 角色卡格式：
 * - PNG 文件包含 tEXt chunk，key 为 "chara"
 * - value 是 base64 编码的 JSON 字符串
 */

/**
 * 从 PNG 文件中读取角色卡元数据
 * @param {File} file - PNG 文件对象
 * @returns {Promise<Object>} - 解析后的角色卡数据
 */
export async function readPngMetadata(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const arrayBuffer = e.target.result;
        const uint8Array = new Uint8Array(arrayBuffer);

        // 验证 PNG 签名
        const pngSignature = [137, 80, 78, 71, 13, 10, 26, 10];
        for (let i = 0; i < 8; i++) {
          if (uint8Array[i] !== pngSignature[i]) {
            throw new Error("不是有效的 PNG 文件");
          }
        }

        // 查找 tEXt chunk
        let offset = 8; // 跳过 PNG 签名
        let metadata = null;

        while (offset < uint8Array.length) {
          // 读取 chunk 长度（4 字节，大端序）
          const length =
            (uint8Array[offset] << 24) |
            (uint8Array[offset + 1] << 16) |
            (uint8Array[offset + 2] << 8) |
            uint8Array[offset + 3];
          offset += 4;

          // 读取 chunk 类型（4 字节）
          const type = String.fromCharCode(
            uint8Array[offset],
            uint8Array[offset + 1],
            uint8Array[offset + 2],
            uint8Array[offset + 3],
          );
          offset += 4;

          // 如果是 tEXt chunk
          if (type === "tEXt") {
            // 读取 chunk 数据
            const data = uint8Array.slice(offset, offset + length);

            // 查找 null 分隔符
            let nullIndex = -1;
            for (let i = 0; i < data.length; i++) {
              if (data[i] === 0) {
                nullIndex = i;
                break;
              }
            }

            if (nullIndex !== -1) {
              // 读取 keyword
              const keyword = new TextDecoder().decode(
                data.slice(0, nullIndex),
              );

              // 如果是 "chara" keyword
              if (keyword === "chara") {
                // 读取 value（base64 编码的 JSON）
                const valueBytes = data.slice(nullIndex + 1);
                const base64String = new TextDecoder().decode(valueBytes);

                // 解码 base64
                const jsonString = atob(base64String);

                // 解析 JSON
                metadata = JSON.parse(jsonString);
                break;
              }
            }
          }

          // 跳过 chunk 数据和 CRC（4 字节）
          offset += length + 4;

          // 如果到达 IEND chunk，停止
          if (type === "IEND") {
            break;
          }
        }

        if (!metadata) {
          throw new Error("PNG 文件中未找到角色卡元数据");
        }

        resolve(metadata);
      } catch (error) {
        reject(error);
      }
    };

    reader.onerror = () => {
      reject(new Error("读取文件失败"));
    };

    reader.readAsArrayBuffer(file);
  });
}

/**
 * 将元数据写回 PNG 文件
 * @param {File} file - 原始 PNG 文件
 * @param {Object} metadata - 修改后的元数据
 * @returns {Promise<Blob>} - 新的 PNG 文件 Blob
 */
export async function writePngMetadata(file, metadata) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const arrayBuffer = e.target.result;
        const uint8Array = new Uint8Array(arrayBuffer);

        // 验证 PNG 签名
        const pngSignature = [137, 80, 78, 71, 13, 10, 26, 10];
        for (let i = 0; i < 8; i++) {
          if (uint8Array[i] !== pngSignature[i]) {
            throw new Error("不是有效的 PNG 文件");
          }
        }

        // 准备新的元数据
        const jsonString = JSON.stringify(metadata);
        const base64String = btoa(jsonString);

        // 创建新的 tEXt chunk
        const keyword = "chara";
        const keywordBytes = new TextEncoder().encode(keyword);
        const valueBytes = new TextEncoder().encode(base64String);

        // tEXt chunk 数据 = keyword + null + value
        const chunkData = new Uint8Array(
          keywordBytes.length + 1 + valueBytes.length,
        );
        chunkData.set(keywordBytes, 0);
        chunkData[keywordBytes.length] = 0; // null 分隔符
        chunkData.set(valueBytes, keywordBytes.length + 1);

        // 计算 CRC
        const crc = calculateCRC(
          new Uint8Array([...new TextEncoder().encode("tEXt"), ...chunkData]),
        );

        // 构建新的 PNG 文件
        const chunks = [];

        // 添加 PNG 签名
        chunks.push(uint8Array.slice(0, 8));

        // 遍历原始 chunks，替换或删除旧的 "chara" tEXt chunk
        let offset = 8;
        let charaChunkFound = false;

        while (offset < uint8Array.length) {
          const length =
            (uint8Array[offset] << 24) |
            (uint8Array[offset + 1] << 16) |
            (uint8Array[offset + 2] << 8) |
            uint8Array[offset + 3];

          const type = String.fromCharCode(
            uint8Array[offset + 4],
            uint8Array[offset + 5],
            uint8Array[offset + 6],
            uint8Array[offset + 7],
          );

          // 如果是 tEXt chunk，检查是否是 "chara"
          if (type === "tEXt") {
            const data = uint8Array.slice(offset + 8, offset + 8 + length);
            let nullIndex = -1;
            for (let i = 0; i < data.length; i++) {
              if (data[i] === 0) {
                nullIndex = i;
                break;
              }
            }

            if (nullIndex !== -1) {
              const keyword = new TextDecoder().decode(
                data.slice(0, nullIndex),
              );

              if (keyword === "chara") {
                // 找到旧的 chara chunk，跳过它
                charaChunkFound = true;
                offset += 8 + length + 4;
                continue;
              }
            }
          }

          // 如果是 IEND chunk，在它之前插入新的 chara chunk
          if (type === "IEND" && !charaChunkFound) {
            // 添加新的 tEXt chunk
            const lengthBytes = new Uint8Array(4);
            lengthBytes[0] = (chunkData.length >> 24) & 0xff;
            lengthBytes[1] = (chunkData.length >> 16) & 0xff;
            lengthBytes[2] = (chunkData.length >> 8) & 0xff;
            lengthBytes[3] = chunkData.length & 0xff;

            chunks.push(lengthBytes);
            chunks.push(new TextEncoder().encode("tEXt"));
            chunks.push(chunkData);
            chunks.push(crc);

            charaChunkFound = true;
          }

          // 复制当前 chunk
          const chunkSize = 8 + length + 4;
          chunks.push(uint8Array.slice(offset, offset + chunkSize));
          offset += chunkSize;
        }

        // 如果没有找到 IEND，说明文件格式有问题
        if (!charaChunkFound) {
          throw new Error("PNG 文件格式错误：未找到 IEND chunk");
        }

        // 合并所有 chunks
        const totalLength = chunks.reduce(
          (sum, chunk) => sum + chunk.length,
          0,
        );
        const result = new Uint8Array(totalLength);
        let position = 0;
        for (const chunk of chunks) {
          result.set(chunk, position);
          position += chunk.length;
        }

        // 创建 Blob
        const blob = new Blob([result], { type: "image/png" });
        resolve(blob);
      } catch (error) {
        reject(error);
      }
    };

    reader.onerror = () => {
      reject(new Error("读取文件失败"));
    };

    reader.readAsArrayBuffer(file);
  });
}

/**
 * 计算 CRC32 校验和
 * @param {Uint8Array} data - 数据
 * @returns {Uint8Array} - 4 字节 CRC
 */
function calculateCRC(data) {
  const crcTable = makeCRCTable();
  let crc = 0xffffffff;

  for (let i = 0; i < data.length; i++) {
    crc = crcTable[(crc ^ data[i]) & 0xff] ^ (crc >>> 8);
  }

  crc = crc ^ 0xffffffff;

  // 转换为 4 字节数组（大端序）
  const result = new Uint8Array(4);
  result[0] = (crc >> 24) & 0xff;
  result[1] = (crc >> 16) & 0xff;
  result[2] = (crc >> 8) & 0xff;
  result[3] = crc & 0xff;

  return result;
}

/**
 * 生成 CRC32 查找表
 * @returns {Uint32Array} - CRC 查找表
 */
function makeCRCTable() {
  const table = new Uint32Array(256);

  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    table[n] = c;
  }

  return table;
}
