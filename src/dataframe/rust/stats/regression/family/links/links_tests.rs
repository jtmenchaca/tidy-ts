//! Link function tests

use super::links_types::*;
use super::links_implementations::*;

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_logit_link() {
        let link = LogitLink;

        // Test link function
        assert!((link.link(0.5).unwrap() - 0.0).abs() < 1e-10);
        assert!((link.link(0.1).unwrap() - (-2.197224577).abs()) < 1e-6);

        // Test inverse link
        assert!((link.link_inverse(0.0).unwrap() - 0.5).abs() < 1e-10);
        assert!((link.link_inverse(1.0).unwrap() - 0.7310585786).abs() < 1e-6);

        // Test mu_eta
        assert!((link.mu_eta(0.0).unwrap() - 0.25).abs() < 1e-10);
    }

    #[test]
    fn test_identity_link() {
        let link = IdentityLink;

        assert_eq!(link.link(5.0).unwrap(), 5.0);
        assert_eq!(link.link_inverse(3.0).unwrap(), 3.0);
        assert_eq!(link.mu_eta(10.0).unwrap(), 1.0);
    }

    #[test]
    fn test_log_link() {
        let link = LogLink;

        assert!((link.link(2.0).unwrap() - 2.0.ln()).abs() < 1e-10);
        assert!((link.link_inverse(1.0).unwrap() - 1.0.exp()).abs() < 1e-10);
        assert!((link.mu_eta(1.0).unwrap() - 1.0.exp()).abs() < 1e-10);
    }

    #[test]
    fn test_power_link() {
        let link = PowerLink(2.0);

        assert_eq!(link.link(3.0).unwrap(), 9.0);
        assert_eq!(link.link_inverse(4.0).unwrap(), 2.0);
        assert_eq!(link.mu_eta(2.0).unwrap(), 4.0);
    }

    #[test]
    fn test_inverse_link() {
        let link = InverseLink;

        assert_eq!(link.link(2.0).unwrap(), 0.5);
        assert_eq!(link.link_inverse(0.5).unwrap(), 2.0);
        assert_eq!(link.mu_eta(2.0).unwrap(), -0.25);
    }

    #[test]
    fn test_sqrt_link() {
        let link = SqrtLink;

        assert_eq!(link.link(4.0).unwrap(), 2.0);
        assert_eq!(link.link_inverse(3.0).unwrap(), 9.0);
        assert_eq!(link.mu_eta(2.0).unwrap(), 4.0);
    }

    #[test]
    fn test_cloglog_link() {
        let link = CloglogLink;

        // Test with valid mu values
        let mu = 0.5;
        let eta = link.link(mu).unwrap();
        let mu_back = link.link_inverse(eta).unwrap();
        assert!((mu - mu_back).abs() < 1e-10);
    }

    #[test]
    fn test_probit_link() {
        let link = ProbitLink;

        // Test with valid mu values
        let mu = 0.5;
        let eta = link.link(mu).unwrap();
        let mu_back = link.link_inverse(eta).unwrap();
        assert!((mu - mu_back).abs() < 1e-6);
    }

    #[test]
    fn test_cauchit_link() {
        let link = CauchitLink;

        // Test with valid mu values
        let mu = 0.5;
        let eta = link.link(mu).unwrap();
        let mu_back = link.link_inverse(eta).unwrap();
        assert!((mu - mu_back).abs() < 1e-6);
    }

    #[test]
    fn test_link_validation() {
        let logit = LogitLink;
        let log = LogLink;
        let inverse = InverseLink;

        // Test valid_mu
        assert!(logit.valid_mu(0.5));
        assert!(!logit.valid_mu(0.0));
        assert!(!logit.valid_mu(1.0));

        assert!(log.valid_mu(1.0));
        assert!(!log.valid_mu(0.0));
        assert!(!log.valid_mu(-1.0));

        assert!(inverse.valid_mu(1.0));
        assert!(!inverse.valid_mu(0.0));

        // Test valid_eta
        assert!(logit.valid_eta(0.0));
        assert!(log.valid_eta(0.0));
        assert!(inverse.valid_eta(1.0));
        assert!(!inverse.valid_eta(0.0));
    }

    #[test]
    fn test_link_function_type() {
        let logit_type = LinkFunctionType::Logit;
        let logit_link = logit_type.create_link();
        assert_eq!(logit_link.name(), "logit");

        let power_type = LinkFunctionType::Power(2.0);
        let power_link = power_type.create_link();
        assert_eq!(power_link.name(), "power");
    }

    #[test]
    fn test_link_roundtrip() {
        let links = vec![
            Box::new(LogitLink) as Box<dyn LinkFunction>,
            Box::new(ProbitLink) as Box<dyn LinkFunction>,
            Box::new(LogLink) as Box<dyn LinkFunction>,
            Box::new(IdentityLink) as Box<dyn LinkFunction>,
            Box::new(InverseLink) as Box<dyn LinkFunction>,
            Box::new(SqrtLink) as Box<dyn LinkFunction>,
            Box::new(CloglogLink) as Box<dyn LinkFunction>,
            Box::new(PowerLink(0.5)) as Box<dyn LinkFunction>,
        ];

        for link in links {
            let test_values = match link.name() {
                "logit" | "probit" | "cauchit" | "cloglog" => vec![0.1, 0.3, 0.5, 0.7, 0.9],
                "log" | "sqrt" | "power" => vec![0.1, 1.0, 2.0, 5.0],
                "identity" => vec![-2.0, -1.0, 0.0, 1.0, 2.0],
                "inverse" => vec![0.1, 1.0, 2.0, 5.0],
                _ => continue,
            };

            for mu in test_values {
                if link.valid_mu(mu) {
                    let eta = link.link(mu).unwrap();
                    if link.valid_eta(eta) {
                        let mu_back = link.link_inverse(eta).unwrap();
                        assert!((mu - mu_back).abs() < 1e-6, 
                            "Roundtrip failed for {}: {} -> {} -> {}", 
                            link.name(), mu, eta, mu_back);
                    }
                }
            }
        }
    }
}
