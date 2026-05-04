import { expect } from "@std/expect";
import {
  glmFit,
  vcovCL,
} from "../../dataframe/ts/wasm/glm-functions.ts";
import { TOL } from "./glm-test-helpers.ts";

// R reference data generated with:
// set.seed(42); n=20; x1=rnorm(n); x2=rnorm(n); cluster=rep(1:5,each=4)
// y=rbinom(n,1,plogis(0.5+0.8*x1-0.3*x2))
// fit=glm(y~x1+x2, family=binomial)
// sandwich::vcovCL(fit, cluster=cluster, type="HC0"/"HC1", cadjust=TRUE/FALSE)
const ref = {
  data: {
    x1: [1.370958447146668, -0.5646981713960887, 0.3631284113373392, 0.6328626049610404, 0.404268323140999, -0.106124516091484, 1.511521997438939, -0.09465903841309756, 2.018423713877042, -0.06271409905242099, 1.304869654223485, 2.286645392701107, -1.388860701112339, -0.2787887668173714, -0.133321336393658, 0.6359503980700744, -0.2842529214160724, -2.656455420904776, -2.440466928575519, 1.320113345730192],
    x2: [-0.3066385940784745, -1.78130843398, -0.1719173557596214, 1.214674699172599, 1.895193461264965, -0.4304691316061997, -0.2572693827689296, -1.76316308519478, 0.4600973548312714, -0.6399948759601192, 0.4554501232412194, 0.7048373372288191, 1.035103521969922, -0.6089263754072111, 0.5049551232979703, -1.717008679073343, -0.784459008379496, -0.8509075941765183, -2.414207649946632, 0.03612260689225563],
    y: [1, 1, 1, 1, 0, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 1, 1, 0, 1, 1],
    cluster: [1, 1, 1, 1, 2, 2, 2, 2, 3, 3, 3, 3, 4, 4, 4, 4, 5, 5, 5, 5],
  },
  vcov_hc0: [
    [1.851321960542239, 0.5256826748322959, -0.2527784811153412],
    [0.5256826748322959, 0.3243970124341567, -0.2140266763569667],
    [-0.2527784811153412, -0.2140266763569671, 0.492714813301648],
  ],
  vcov_hc1: [
    [2.069124544135443, 0.5875276954008012, -0.2825171259524401],
    [0.587527695400801, 0.3625613668381743, -0.2392062853401389],
    [-0.28251712595244, -0.2392062853401387, 0.550681261925371],
  ],
  vcov_hc0_noadj: [
    [1.481057568433791, 0.4205461398658368, -0.2022227848922731],
    [0.4205461398658368, 0.2595176099473264, -0.1712213410855744],
    [-0.2022227848922731, -0.1712213410855745, 0.3941718506413193],
  ],
  // HC2 clustered (5 clusters, cadjust=TRUE)
  vcov_hc2: [
    [2.6204150111825419e+00, -3.8249631701270936e-01, 4.0965315726486629e-01],
    [-3.8249631701270864e-01, 1.2754029577754423e+01, -5.1606377564797645e+00],
    [4.0965315726486795e-01, -5.1606377564797548e+00, 2.3868593586378126e+00],
  ],
  // HC3 clustered (5 clusters, cadjust=TRUE)
  vcov_hc3: [
    [4.5802677593031946e+00, -5.4732016472920879e+00, 3.4623502749802935e+00],
    [-5.4732016472920719e+00, 1.9595703847284312e+02, -9.2925791702108484e+01],
    [3.4623502749802983e+00, -9.2925791702108398e+01, 4.4559996307818587e+01],
  ],
  // HC2 clustered without cadjust
  vcov_hc2_noadj: [
    [2.0963320089460331e+00, -3.0599705361016705e-01, 3.2772252581189254e-01],
    [-3.0599705361016738e-01, 1.0203223662203541e+01, -4.1285102051838161e+00],
    [3.2772252581189193e-01, -4.1285102051838152e+00, 1.9094874869102616e+00],
  ],
  // HC3 clustered without cadjust
  vcov_hc3_noadj: [
    [3.6642142074425568e+00, -4.3785613178336797e+00, 2.7698802199842421e+00],
    [-4.3785613178336744e+00, 1.5676563077827444e+02, -7.4340633361686713e+01],
    [2.7698802199842247e+00, -7.4340633361686784e+01, 3.5647997046254908e+01],
  ],
  // HC2 non-clustered (g==n, each obs is its own cluster)
  vcov_hc2_nocl: [
    [1.3215121731789035e+00, 2.1899400806186120e-01, -9.9846624919562130e-02],
    [2.1899400806186087e-01, 1.2580972374545618e+00, -6.6722308532506969e-01],
    [-9.9846624919561783e-02, -6.6722308532506980e-01, 1.1776334940491551e+00],
  ],
  // HC3 non-clustered (g==n)
  vcov_hc3_nocl: [
    [2.0589593639256565e+00, -5.3507693812982904e-01, 8.4537774555292124e-03],
    [-5.3507693812982982e-01, 3.4483971927164081e+00, -3.5508537751922781e-01],
    [8.4537774555296912e-03, -3.5508537751922836e-01, 1.7739415124587634e+00],
  ],
  coefficients: [1.106189643350182, 2.680469907286557, -2.580249115623844],
};

function assertMatrixClose(
  actual: number[][],
  expected: number[][],
  tol: number,
  label: string,
) {
  expect(actual.length).toBe(expected.length);
  for (let i = 0; i < actual.length; i++) {
    expect(actual[i].length).toBe(expected[i].length);
    for (let j = 0; j < actual[i].length; j++) {
      const relErr = Math.abs(actual[i][j] - expected[i][j]) /
        Math.max(Math.abs(expected[i][j]), 1e-10);
      if (relErr > tol) {
        throw new Error(
          `${label}[${i}][${j}]: got ${actual[i][j]}, expected ${expected[i][j]}, relErr=${relErr}`,
        );
      }
    }
  }
}

Deno.test("vcovCL: HC0 with cadjust matches R sandwich::vcovCL", () => {
  const fit = glmFit(
    "y ~ x1 + x2",
    "binomial",
    "logit",
    ref.data,
  );

  // Verify GLM coefficients match R
  for (let i = 0; i < ref.coefficients.length; i++) {
    expect(Math.abs(fit.coefficients[i] - ref.coefficients[i])).toBeLessThan(
      1e-6,
    );
  }

  const result = vcovCL({
    result: fit,
    cluster: ref.data.cluster,
    type: "HC0",
    cadjust: true,
  });

  expect(result.names.length).toBe(3);
  expect(result.nClusters).toBe(5);
  expect(result.type).toBe("HC0");
  assertMatrixClose(result.matrix, ref.vcov_hc0, TOL, "vcov_hc0");
});

Deno.test("vcovCL: HC1 with cadjust matches R sandwich::vcovCL", () => {
  const fit = glmFit(
    "y ~ x1 + x2",
    "binomial",
    "logit",
    ref.data,
  );

  const result = vcovCL({
    result: fit,
    cluster: ref.data.cluster,
    type: "HC1",
    cadjust: true,
  });

  expect(result.type).toBe("HC1");
  assertMatrixClose(result.matrix, ref.vcov_hc1, TOL, "vcov_hc1");
});

Deno.test("vcovCL: HC0 without cadjust matches R sandwich::vcovCL", () => {
  const fit = glmFit(
    "y ~ x1 + x2",
    "binomial",
    "logit",
    ref.data,
  );

  const result = vcovCL({
    result: fit,
    cluster: ref.data.cluster,
    type: "HC0",
    cadjust: false,
  });

  assertMatrixClose(
    result.matrix,
    ref.vcov_hc0_noadj,
    TOL,
    "vcov_hc0_noadj",
  );
});

// --- HC2 tests ---

Deno.test("vcovCL: HC2 clustered with cadjust matches R", () => {
  const fit = glmFit("y ~ x1 + x2", "binomial", "logit", ref.data);

  const result = vcovCL({
    result: fit,
    cluster: ref.data.cluster,
    type: "HC2",
    cadjust: true,
  });

  expect(result.type).toBe("HC2");
  expect(result.nClusters).toBe(5);
  assertMatrixClose(result.matrix, ref.vcov_hc2, TOL, "vcov_hc2");
});

Deno.test("vcovCL: HC2 clustered without cadjust matches R", () => {
  const fit = glmFit("y ~ x1 + x2", "binomial", "logit", ref.data);

  const result = vcovCL({
    result: fit,
    cluster: ref.data.cluster,
    type: "HC2",
    cadjust: false,
  });

  assertMatrixClose(
    result.matrix,
    ref.vcov_hc2_noadj,
    TOL,
    "vcov_hc2_noadj",
  );
});

Deno.test("vcovCL: HC2 non-clustered (g==n) matches R", () => {
  const fit = glmFit("y ~ x1 + x2", "binomial", "logit", ref.data);

  const nocl = Array.from({ length: 20 }, (_, i) => i + 1);
  const result = vcovCL({
    result: fit,
    cluster: nocl,
    type: "HC2",
    cadjust: true,
  });

  expect(result.nClusters).toBe(20);
  assertMatrixClose(result.matrix, ref.vcov_hc2_nocl, TOL, "vcov_hc2_nocl");
});

// --- HC3 tests ---

Deno.test("vcovCL: HC3 clustered with cadjust matches R", () => {
  const fit = glmFit("y ~ x1 + x2", "binomial", "logit", ref.data);

  const result = vcovCL({
    result: fit,
    cluster: ref.data.cluster,
    type: "HC3",
    cadjust: true,
  });

  expect(result.type).toBe("HC3");
  expect(result.nClusters).toBe(5);
  assertMatrixClose(result.matrix, ref.vcov_hc3, TOL, "vcov_hc3");
});

Deno.test("vcovCL: HC3 clustered without cadjust matches R", () => {
  const fit = glmFit("y ~ x1 + x2", "binomial", "logit", ref.data);

  const result = vcovCL({
    result: fit,
    cluster: ref.data.cluster,
    type: "HC3",
    cadjust: false,
  });

  assertMatrixClose(
    result.matrix,
    ref.vcov_hc3_noadj,
    TOL,
    "vcov_hc3_noadj",
  );
});

Deno.test("vcovCL: HC3 non-clustered (g==n) matches R", () => {
  const fit = glmFit("y ~ x1 + x2", "binomial", "logit", ref.data);

  const nocl = Array.from({ length: 20 }, (_, i) => i + 1);
  const result = vcovCL({
    result: fit,
    cluster: nocl,
    type: "HC3",
    cadjust: true,
  });

  expect(result.nClusters).toBe(20);
  assertMatrixClose(result.matrix, ref.vcov_hc3_nocl, TOL, "vcov_hc3_nocl");
});
