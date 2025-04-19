import { readFile } from "node:fs/promises"

import jszip from "jszip"

/**
 * @import JSZip from "jszip"
 */

/**
 * @template T
 * @typedef {function(): Promise<T>} IO
 */

/**
 * @template T
 * @template U
 * @param {IO<T>} io
 * @param {function(T): IO<U>} mapper
 * @returns {IO<U>}
 */
function bind(io, mapper) {
  return () => {
    return Promise.resolve()
      .then((_) => io())
      .then((t) => mapper(t)())
  }
}

/**
 * @template T
 * @template U
 * @param {function(T): Promise<U>} pure The pure function.
 * @returns {function(T): IO<U>}
 */
function lift(pure) {
  return (t) => () => pure(t)
}

/**
 * @template T
 * @param {T} t
 * @returns {IO<T>}
 */
function _of(t) {
  return () => Promise.resolve(t)
}

/**
 * Gets the bytes from the specified file.
 * @param {string} filename The name of the file to be read.
 * @returns {IO<Buffer>}
 */
const filename2buffer = (filename) => () => readFile(filename)

/**
 * Parses the buffer as a zip file object.
 * @param {Buffer} buffer The buffer to be parsed.
 * @returns {Promise<JSZip>}
 */
const buffer2zip = (buffer) => jszip.loadAsync(buffer)

/**
 * Gets the item names from the zip object.
 * @param {JSZip} zip The zip object.
 * @returns {string[]} The item names of the specified zip object.
 */
const zip2names = (zip) => Object.keys(zip.files)

/**
 * Writes the string to stdout.
 * @param {string} s The string to be written.
 * @returns {IO<Void>}
 */
const str2stdout = (s) => () => Promise.resolve(console.log(s))

/**
 * Writes the strings to stdout.
 * @param {string[]} strs The strings to be written.
 * @returns {IO<Void>}
 */
const strings2stdout = (strs) => () => {
  return Promise.resolve()
    .then(async(_) => {
      for (const s of strs) {
        await str2stdout(s)()
      }
    })
}

/**
 * Reads the zip file and prints item names.
 * @param {string} zipname The name of the zip file.
 * @returns {IO<Void>}
 */
const zipname2itemnames2stdout = (zipname) => () => {
  return Promise.resolve()
    .then((_) => {
      /** @type IO<Buffer> */
      const buf = filename2buffer(zipname)

      /** @type IO<JSZip> */
      const zip = bind(
        buf,
        lift(buffer2zip),
      )

      /** @type IO<string[]> */
      const names = bind(
        zip,
        lift((z) => Promise.resolve(zip2names(z))),
      )

      /** @type IO<Void> */
      const names2stdout = bind(names, strings2stdout)

      return names2stdout()
    })
}

/** @type IO<string> */
const env2zipname = _of(process.env.ENV_ZIP_FILENAME ?? "")

/** @type IO<Void> */
const main = () => {
  return Promise.resolve()
    .then((_) => {
      /** @type IO<string> */
      const zname = env2zipname

      /** @type IO<Void> */
      const env2zname2zip2names2stdout = bind(zname, zipname2itemnames2stdout)

      return env2zname2zip2names2stdout()
    })
}

main()
  .catch(console.error)
