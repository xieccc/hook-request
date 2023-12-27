import commonjs from "@rollup/plugin-commonjs";
import typescript from "@rollup/plugin-typescript";
const config = {
  input: './src/index.ts',
  output: [
    {
      file: './dist/index.js',
      format: "cjs",
      sourcemap: true
    },
    {
      file: './dist/index.esm.js',
      format: "es",
      sourcemap: true
    },
    {
      name: "index.umd.js",
      file: './dist/index.umd.js',
      format: "umd",
      sourcemap: true
    },
  ],
  plugins: [
    commonjs(), 
    typescript()
  ],
};

export default config;
