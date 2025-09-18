/* QR Solve specific parts from Applic.h */

/* ../../appl/dqrutl.f: interfaces to dqrsl */
void F77_NAME(dqrcf)(double *x, int *n, int *k, double *qraux,
		     double *y, int *ny, double *b, int *info);
/* find qr decomposition, dqrdc2() is basis of R's qr(),
   also used by nlme and many other packages. */
void F77_NAME(dqrdc2)(double *x, int *ldx, int *n, int *p,
		      double *tol, int *rank,
		      double *qraux, int *pivot, double *work);
void F77_NAME(dqrls)(double *x, int *n, int *p, double *y, int *ny,
		     double *tol, double *b, double *rsd,
		     double *qty, int *k,
		     int *jpvt, double *qraux, double *work);
