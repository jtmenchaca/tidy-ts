/* QR Solve specific parts from mAR.c */

static void qr_solve(Array x, Array y, Array coef)
/* Translation of the R function qr.solve into pure C
   NB We have to transpose the matrices since the ordering of an array is different in Fortran
   NB2 We have to copy x to avoid it being overwritten.
*/
{
    int i, info = 0, rank, *pivot, n, p;
    const void *vmax;
    double tol = 1.0E-7, *qraux, *work;
    Array xt, yt, coeft;

    assert(NROW(x) == NROW(y));
    assert(NCOL(coef) == NCOL(y));
    assert(NCOL(x) == NROW(coef));

    vmax = vmaxget();

    qraux = (double *) R_alloc(NCOL(x), sizeof(double));
    pivot = (int *) R_alloc(NCOL(x), sizeof(int));
    work  = (double *) R_alloc(2*NCOL(x), sizeof(double));

    for(i = 0; i < NCOL(x); i++)
	pivot[i] = i+1;

    xt = make_zero_matrix(NCOL(x), NROW(x));
    transpose_matrix(x,xt);

    n = NROW(x);
    p = NCOL(x);

    F77_CALL(dqrdc2)(VECTOR(xt), &n, &n, &p, &tol, &rank,
		       qraux, pivot, work);

    if (rank != p)
	error(_("Singular matrix in qr_solve"));

    yt = make_zero_matrix(NCOL(y), NROW(y));
    coeft = make_zero_matrix(NCOL(coef), NROW(coef));
    transpose_matrix(y, yt);

    F77_CALL(dqrcf)(VECTOR(xt), &NROW(x), &rank, qraux,
	yt.vec, &NCOL(y), coeft.vec, &info);

    transpose_matrix(coeft,coef);

    vmaxset(vmax);
}
