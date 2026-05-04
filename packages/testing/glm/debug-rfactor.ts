import { glm } from "../../dataframe/ts/wasm/glm-functions.ts";
import { createDataFrame } from "@tidy-ts/dataframe";

const mtcars = {
  carb: [4,4,1,1,2,1,4,2,2,4,4,3,3,3,4,4,4,1,2,1,1,2,2,4,2,1,2,2,4,6,8,2],
  wt: [2.62,2.875,2.32,3.215,3.44,3.46,3.57,3.19,3.15,3.44,3.44,4.07,3.73,3.78,5.25,5.424,5.345,2.2,1.615,1.835,2.465,3.52,3.435,3.84,3.845,1.935,2.14,1.513,3.17,2.77,3.57,2.78],
  hp: [110,110,93,110,175,105,245,62,95,123,123,180,180,180,205,215,230,66,52,65,97,150,150,245,175,66,91,113,264,175,335,109],
};

const df = createDataFrame({ columns: { carb: mtcars.carb, wt: mtcars.wt, hp: mtcars.hp } });
const fit = glm({ formula: "carb ~ wt + hp", family: "poisson", link: "log", data: df });
console.log("coef:", fit.coefficients);
console.log("SE:", fit.std_errors);
