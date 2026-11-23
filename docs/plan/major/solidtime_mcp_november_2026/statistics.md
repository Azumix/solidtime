# Statistics — solidtime_mcp_november_2026

Generated 2026-11-23T10:54:42Z by ReviewTool 0.2.0 from `session-log.jsonl` (7 events, 1 session). Pricing as of 2026-10-06.

## Summary

| Metric | Value |
| --- | --- |
| Tokens | 19.3M |
| Cost (USD) | ~$6.78 |
| Actions | 7 |
| Agents | 4 |
| Duration | 0h 33m 56s |
| Commits | 0 |
| Lines | +0 / -0 |
| Files touched | 14 |

## Tokens by agent

| Agent | Messages | Input | Output | Cache read | Cache write | Total | Cost (USD) |
| --- | --- | --- | --- | --- | --- | --- | --- |
| orchestrator | 134 | 310 | 59.2k | 18.1M | 156.3k | 18.3M | ~$6.06 |
| vex-workflow:implementer | 16 | 34 | 24.7k | 611.4k | 58.6k | 694.8k | ~$0.52 |
| vex-workflow:test-author | 9 | 18 | 8.5k | 212.1k | 29.5k | 250.1k | ~$0.20 |
| vex-workflow:runner | 4 | 8 | 3.1k | 27.2k | 11.4k | 41.7k | ~$0.00 |

## Tokens by model

| Model | Family | Messages | Input | Output | Cache read | Cache write | Total | Cost (USD) |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| claude-opus-5-5 | opus | 134 | 310 | 59.2k | 18.1M | 156.3k | 18.3M | ~$6.06 |
| claude-sonnet-5-5 | sonnet | 25 | 52 | 33.2k | 823.5k | 88.1k | 944.9k | ~$0.72 |
| claude-haiku-5-5 | haiku | 4 | 8 | 3.1k | 27.2k | 11.4k | 41.7k | ~$0.00 |

## By session

| Session | Actions | Tokens | Cost (USD) | Duration |
| --- | --- | --- | --- | --- |
| solidtime_mcp_november_2026 | 7 | 19.3M | ~$6.78 | 0h 33m 56s |

## Claude sessions

| Id | Status | Files | Messages | Before first event (msgs / tokens) | After last event (msgs / tokens) | Unparseable lines | Rejected usage lines | Unreadable files |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1ac8595b-4b3c-4e45-845d-eaf80b8f36f1 | ok | 4 | 163 | 77 / 8.6M | 0 / 0 | 0 | 0 | 0 |

All messages of these sessions are counted; the before/after columns are information only.

## Approximations and warnings

- Log warning `unknown_agent` (line 1, evt-001)
- Log warning `unknown_agent` (line 2, evt-002)
- Log warning `unknown_agent` (line 3, evt-003)
- Log warning `unknown_agent` (line 7, evt-007)

## Data

<!-- reviewtool:statistics -->
```json
{
  "by_session": {
    "solidtime_mcp_november_2026": {
      "charts": {
        "agent_model": [
          {
            "agent": "main",
            "models": [
              {
                "count": 4,
                "key": "opus",
                "raw": [
                  "claude-opus-5-5"
                ]
              }
            ]
          },
          {
            "agent": "implementer",
            "models": [
              {
                "count": 1,
                "key": "opus",
                "raw": [
                  "claude-opus-5-5"
                ]
              }
            ]
          },
          {
            "agent": "runner",
            "models": [
              {
                "count": 1,
                "key": "opus",
                "raw": [
                  "claude-opus-5-5"
                ]
              }
            ]
          },
          {
            "agent": "test-author",
            "models": [
              {
                "count": 1,
                "key": "opus",
                "raw": [
                  "claude-opus-5-5"
                ]
              }
            ]
          }
        ],
        "by_action": [
          {
            "count": 3,
            "key": "decision"
          },
          {
            "count": 1,
            "key": "implement"
          },
          {
            "count": 1,
            "key": "plan"
          },
          {
            "count": 1,
            "key": "test"
          },
          {
            "count": 1,
            "key": "verify"
          }
        ],
        "by_agent": [
          {
            "count": 4,
            "key": "main"
          },
          {
            "count": 1,
            "key": "implementer"
          },
          {
            "count": 1,
            "key": "runner"
          },
          {
            "count": 1,
            "key": "test-author"
          }
        ],
        "by_model": [
          {
            "count": 7,
            "key": "opus"
          }
        ],
        "by_result": [
          {
            "count": 5,
            "key": "ok"
          },
          {
            "count": 2,
            "key": "pass"
          }
        ],
        "over_time": {
          "bucket_s": 300,
          "points": [
            {
              "count": 2,
              "start": "2026-11-23T10:20:00Z"
            },
            {
              "count": 0,
              "start": "2026-11-23T10:25:00Z"
            },
            {
              "count": 1,
              "start": "2026-11-23T10:30:00Z"
            },
            {
              "count": 0,
              "start": "2026-11-23T10:35:00Z"
            },
            {
              "count": 0,
              "start": "2026-11-23T10:40:00Z"
            },
            {
              "count": 3,
              "start": "2026-11-23T10:45:00Z"
            },
            {
              "count": 1,
              "start": "2026-11-23T10:50:00Z"
            }
          ]
        }
      },
      "cost": {
        "approximations": [],
        "complete": true,
        "usd": 6.782265
      },
      "kpis": {
        "actions": 7,
        "agents": 4,
        "commits": 0,
        "cost_usd": 6.782265,
        "duration_s": 2036,
        "files_touched": 14,
        "lines_added": 0,
        "lines_deleted": 0,
        "tokens_total": 19331592
      },
      "tokens": {
        "by_agent": [
          {
            "cache_read": 18129185,
            "cache_write_1h": 156292,
            "cache_write_5m": 0,
            "cache_write_unknown_ttl": 0,
            "cost_known": true,
            "cost_usd": 6.061853,
            "input": 310,
            "key": "orchestrator",
            "messages": 134,
            "output": 59222,
            "total": 18345009
          },
          {
            "cache_read": 611397,
            "cache_write_1h": 0,
            "cache_write_5m": 58645,
            "cache_write_unknown_ttl": 0,
            "cost_known": true,
            "cost_usd": 0.51622,
            "input": 34,
            "key": "vex-workflow:implementer",
            "messages": 16,
            "output": 24726,
            "total": 694802
          },
          {
            "cache_read": 212104,
            "cache_write_1h": 0,
            "cache_write_5m": 29494,
            "cache_write_unknown_ttl": 0,
            "cost_known": true,
            "cost_usd": 0.200952,
            "input": 18,
            "key": "vex-workflow:test-author",
            "messages": 9,
            "output": 8476,
            "total": 250092
          },
          {
            "cache_read": 27185,
            "cache_write_1h": 0,
            "cache_write_5m": 11415,
            "cache_write_unknown_ttl": 0,
            "cost_known": true,
            "cost_usd": 0.00324,
            "input": 8,
            "key": "vex-workflow:runner",
            "messages": 4,
            "output": 3081,
            "total": 41689
          }
        ],
        "by_model": [
          {
            "cache_read": 18129185,
            "cache_write_1h": 156292,
            "cache_write_5m": 0,
            "cache_write_unknown_ttl": 0,
            "cost_known": true,
            "cost_usd": 6.061853,
            "family": "opus",
            "fast_messages": 0,
            "input": 310,
            "key": "claude-opus-5-5",
            "long_context_messages": 0,
            "messages": 134,
            "output": 59222,
            "total": 18345009
          },
          {
            "cache_read": 823501,
            "cache_write_1h": 0,
            "cache_write_5m": 88139,
            "cache_write_unknown_ttl": 0,
            "cost_known": true,
            "cost_usd": 0.717172,
            "family": "sonnet",
            "fast_messages": 0,
            "input": 52,
            "key": "claude-sonnet-5-5",
            "long_context_messages": 0,
            "messages": 25,
            "output": 33202,
            "total": 944894
          },
          {
            "cache_read": 27185,
            "cache_write_1h": 0,
            "cache_write_5m": 11415,
            "cache_write_unknown_ttl": 0,
            "cost_known": true,
            "cost_usd": 0.00324,
            "family": "haiku",
            "fast_messages": 0,
            "input": 8,
            "key": "claude-haiku-5-5",
            "long_context_messages": 0,
            "messages": 4,
            "output": 3081,
            "total": 41689
          }
        ],
        "cache_read": 18979871,
        "cache_write_1h": 156292,
        "cache_write_5m": 99554,
        "cache_write_unknown_ttl": 0,
        "input": 370,
        "messages": 163,
        "output": 95505,
        "reasons": [],
        "status": "ok",
        "total": 19331592,
        "unknown_models": []
      }
    }
  },
  "change": {
    "category": "major",
    "folder": "docs/plan/major/solidtime_mcp_november_2026",
    "name": "solidtime_mcp_november_2026"
  },
  "claude_sessions": [
    {
      "duplicate_lines": 163,
      "files": 4,
      "files_unreadable": 0,
      "id": "1ac8595b-4b3c-4e45-845d-eaf80b8f36f1",
      "lines_unparseable": 0,
      "messages": 163,
      "outside": {
        "after_messages": 0,
        "after_tokens": 0,
        "before_messages": 77,
        "before_tokens": 8572140
      },
      "status": "ok",
      "usage_rejected": 0,
      "window": {
        "end": "2026-11-23T10:54:43Z",
        "start": "2026-11-23T10:20:46Z"
      }
    }
  ],
  "generated_at": "2026-11-23T10:54:42Z",
  "git": {
    "margin_minutes": 120,
    "max_commits": 200,
    "since": "2026-11-23T08:20:46Z",
    "status": "ok",
    "until": "2026-11-23T12:54:42Z"
  },
  "pricing": {
    "as_of": "2026-10-06",
    "file": "pricing.json"
  },
  "schema": "reviewtool.statistics/1",
  "source": {
    "event_count": 7,
    "last_event_id": "evt-007",
    "last_timestamp": "2026-11-23T10:54:42Z",
    "log": "session-log.jsonl",
    "sessions": 1,
    "warnings": 4
  },
  "tool_version": "0.2.0",
  "total": {
    "charts": {
      "agent_model": [
        {
          "agent": "main",
          "models": [
            {
              "count": 4,
              "key": "opus",
              "raw": [
                "claude-opus-5-5"
              ]
            }
          ]
        },
        {
          "agent": "implementer",
          "models": [
            {
              "count": 1,
              "key": "opus",
              "raw": [
                "claude-opus-5-5"
              ]
            }
          ]
        },
        {
          "agent": "runner",
          "models": [
            {
              "count": 1,
              "key": "opus",
              "raw": [
                "claude-opus-5-5"
              ]
            }
          ]
        },
        {
          "agent": "test-author",
          "models": [
            {
              "count": 1,
              "key": "opus",
              "raw": [
                "claude-opus-5-5"
              ]
            }
          ]
        }
      ],
      "by_action": [
        {
          "count": 3,
          "key": "decision"
        },
        {
          "count": 1,
          "key": "implement"
        },
        {
          "count": 1,
          "key": "plan"
        },
        {
          "count": 1,
          "key": "test"
        },
        {
          "count": 1,
          "key": "verify"
        }
      ],
      "by_agent": [
        {
          "count": 4,
          "key": "main"
        },
        {
          "count": 1,
          "key": "implementer"
        },
        {
          "count": 1,
          "key": "runner"
        },
        {
          "count": 1,
          "key": "test-author"
        }
      ],
      "by_model": [
        {
          "count": 7,
          "key": "opus"
        }
      ],
      "by_result": [
        {
          "count": 5,
          "key": "ok"
        },
        {
          "count": 2,
          "key": "pass"
        }
      ],
      "over_time": {
        "bucket_s": 300,
        "points": [
          {
            "count": 2,
            "start": "2026-11-23T10:20:00Z"
          },
          {
            "count": 0,
            "start": "2026-11-23T10:25:00Z"
          },
          {
            "count": 1,
            "start": "2026-11-23T10:30:00Z"
          },
          {
            "count": 0,
            "start": "2026-11-23T10:35:00Z"
          },
          {
            "count": 0,
            "start": "2026-11-23T10:40:00Z"
          },
          {
            "count": 3,
            "start": "2026-11-23T10:45:00Z"
          },
          {
            "count": 1,
            "start": "2026-11-23T10:50:00Z"
          }
        ]
      }
    },
    "cost": {
      "approximations": [],
      "complete": true,
      "usd": 6.782265
    },
    "kpis": {
      "actions": 7,
      "agents": 4,
      "commits": 0,
      "cost_usd": 6.782265,
      "duration_s": 2036,
      "files_touched": 14,
      "lines_added": 0,
      "lines_deleted": 0,
      "tokens_total": 19331592
    },
    "tokens": {
      "by_agent": [
        {
          "cache_read": 18129185,
          "cache_write_1h": 156292,
          "cache_write_5m": 0,
          "cache_write_unknown_ttl": 0,
          "cost_known": true,
          "cost_usd": 6.061853,
          "input": 310,
          "key": "orchestrator",
          "messages": 134,
          "output": 59222,
          "total": 18345009
        },
        {
          "cache_read": 611397,
          "cache_write_1h": 0,
          "cache_write_5m": 58645,
          "cache_write_unknown_ttl": 0,
          "cost_known": true,
          "cost_usd": 0.51622,
          "input": 34,
          "key": "vex-workflow:implementer",
          "messages": 16,
          "output": 24726,
          "total": 694802
        },
        {
          "cache_read": 212104,
          "cache_write_1h": 0,
          "cache_write_5m": 29494,
          "cache_write_unknown_ttl": 0,
          "cost_known": true,
          "cost_usd": 0.200952,
          "input": 18,
          "key": "vex-workflow:test-author",
          "messages": 9,
          "output": 8476,
          "total": 250092
        },
        {
          "cache_read": 27185,
          "cache_write_1h": 0,
          "cache_write_5m": 11415,
          "cache_write_unknown_ttl": 0,
          "cost_known": true,
          "cost_usd": 0.00324,
          "input": 8,
          "key": "vex-workflow:runner",
          "messages": 4,
          "output": 3081,
          "total": 41689
        }
      ],
      "by_model": [
        {
          "cache_read": 18129185,
          "cache_write_1h": 156292,
          "cache_write_5m": 0,
          "cache_write_unknown_ttl": 0,
          "cost_known": true,
          "cost_usd": 6.061853,
          "family": "opus",
          "fast_messages": 0,
          "input": 310,
          "key": "claude-opus-5-5",
          "long_context_messages": 0,
          "messages": 134,
          "output": 59222,
          "total": 18345009
        },
        {
          "cache_read": 823501,
          "cache_write_1h": 0,
          "cache_write_5m": 88139,
          "cache_write_unknown_ttl": 0,
          "cost_known": true,
          "cost_usd": 0.717172,
          "family": "sonnet",
          "fast_messages": 0,
          "input": 52,
          "key": "claude-sonnet-5-5",
          "long_context_messages": 0,
          "messages": 25,
          "output": 33202,
          "total": 944894
        },
        {
          "cache_read": 27185,
          "cache_write_1h": 0,
          "cache_write_5m": 11415,
          "cache_write_unknown_ttl": 0,
          "cost_known": true,
          "cost_usd": 0.00324,
          "family": "haiku",
          "fast_messages": 0,
          "input": 8,
          "key": "claude-haiku-5-5",
          "long_context_messages": 0,
          "messages": 4,
          "output": 3081,
          "total": 41689
        }
      ],
      "cache_read": 18979871,
      "cache_write_1h": 156292,
      "cache_write_5m": 99554,
      "cache_write_unknown_ttl": 0,
      "input": 370,
      "messages": 163,
      "output": 95505,
      "reasons": [],
      "status": "ok",
      "total": 19331592,
      "unknown_models": []
    }
  },
  "warnings": [
    {
      "code": "unknown_agent",
      "event_id": "evt-001",
      "line": 1,
      "params": {
        "value": "main"
      }
    },
    {
      "code": "unknown_agent",
      "event_id": "evt-002",
      "line": 2,
      "params": {
        "value": "main"
      }
    },
    {
      "code": "unknown_agent",
      "event_id": "evt-003",
      "line": 3,
      "params": {
        "value": "main"
      }
    },
    {
      "code": "unknown_agent",
      "event_id": "evt-007",
      "line": 7,
      "params": {
        "value": "main"
      }
    }
  ]
}
```
