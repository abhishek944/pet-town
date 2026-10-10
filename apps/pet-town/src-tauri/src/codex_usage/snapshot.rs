use super::{
    model::{Reading, Session, Snapshot},
    pricing,
};

fn reading(session: &Session) -> Reading {
    if session.inherited_history {
        return Reading {
            model: session.model.clone().or_else(|| session.hook_model.clone()),
            reason: Some("fork-inherited-history".into()),
            ..Reading::default()
        };
    }
    let measured = session.tokens.is_some();
    Reading {
        status: if !measured {
            "unavailable"
        } else if session.partial || session.measurement_incomplete {
            "partial"
        } else {
            "measured"
        }
        .into(),
        model: session.model.clone().or_else(|| session.hook_model.clone()),
        tokens: session.tokens.clone().unwrap_or_default(),
        counter_epoch: session.counter_epoch,
        estimated_credits: pricing::estimate(session),
        models: session.models.keys().cloned().collect(),
        updated_at_seconds: (session.updated_at_seconds > 0).then_some(session.updated_at_seconds),
        reason: None,
        coin_contribution: None,
    }
}

pub(super) fn aggregate(sessions: &[Session]) -> Snapshot {
    let mut snapshot = Snapshot {
        available: true,
        tracked_sessions: sessions.len(),
        ..Snapshot::default()
    };
    let mut estimates = Some(0.0);
    let mut partial = false;
    let mut models = std::collections::BTreeSet::new();
    for session in sessions {
        let current = reading(session);
        for agent in &session.agents {
            let replace = snapshot
                .by_agent
                .get(agent)
                .is_none_or(|old| old.updated_at_seconds <= current.updated_at_seconds);
            if replace {
                snapshot.by_agent.insert(agent.clone(), current.clone());
            }
        }
        if current.status != "unavailable" {
            snapshot.measured_sessions += 1;
            snapshot.totals.tokens.add(&current.tokens);
            snapshot.totals.updated_at_seconds = snapshot
                .totals
                .updated_at_seconds
                .max(current.updated_at_seconds);
        }
        estimates = estimates
            .zip(current.estimated_credits)
            .map(|(sum, value)| sum + value);
        partial |= current.status != "measured";
        models.extend(current.models);
    }
    snapshot.totals.status = if snapshot.measured_sessions == 0 {
        "unavailable"
    } else if partial {
        "partial"
    } else {
        "measured"
    }
    .into();
    snapshot.totals.estimated_credits = if snapshot.measured_sessions == 0 {
        None
    } else {
        estimates
    };
    snapshot.totals.model = (models.len() == 1).then(|| models.iter().next().unwrap().clone());
    snapshot.totals.models = models.into_iter().collect();
    snapshot
}
