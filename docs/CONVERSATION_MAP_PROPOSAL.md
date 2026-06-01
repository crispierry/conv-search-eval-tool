# Conversation Map Proposal

## Intent

Keep the previous evaluator experience intact, and add a conversation map as a focused way to understand follow-up depth.

The map should help reviewers see how one starter query expands into follow-up paths across depth levels, then jump into the existing detail and review surfaces for the selected node.

## What To Keep

- A dedicated conversation map view for a selected run and starter query.
- Visible depth levels for the conversation path, especially depths 1 through 5.
- A zoomable map so reviewers can move between the whole conversation shape and individual query nodes.
- Node selection that drives the existing detail/review content.
- Status signals on each node, including passing, needs review, failing, dead end, or not yet evaluated.

## What Not To Carry Forward

- Do not turn the whole product into a draggable Figma-style board.
- Do not make runs, queries, review, and trends into floating movable modules.
- Do not replace the previous tab/section structure with a single canvas.
- Do not require touchpad gestures as the only zoom mechanism.
- Do not make reviewers arrange the workspace before they can evaluate results.

## Proposed Experience

The previous app structure remains the foundation:

- Runs
- Queries
- Automated detail/review view
- Human review
- Trends or rollups

Add Conversation Map as either:

- A new top-level tab, or
- A panel within the existing query/detail flow.

The map should be scoped to the selected run and starter query. Reviewers should be able to pick a query from the existing query list, open its map, then select any node to inspect its response, results, blurb, follow-up suggestions, quality scores, and reviewer decisions.

## Map Behavior

Each map node represents one evaluated query in the conversation tree.

Node content should include:

- Query text
- Depth level
- Pass/fail/review status
- Brief quality signal
- Whether the node has follow-up children

Edges represent generated follow-up paths.

The map should support:

- Zoom in
- Zoom out
- Fit to view
- Reset zoom
- Pan by dragging the canvas background
- Click a node to select it
- Keyboard-accessible selection where practical

Zoom controls should be explicit buttons in the UI so the experience does not depend on touchpad gestures.

## Detail Integration

Selecting a node should update the existing detail/review experience instead of opening an unrelated floating module.

The selected node should show:

- AI blurb
- Search results
- AI custom blurbs
- Follow-up suggestions
- Stage 1 gate findings
- Stage 2 quality ratings
- Human review controls for result validity, rank position, conversation blurb, AI custom blurbs, follow-up suggestions, gates, and commentary

This keeps the map as navigation and context, while the existing evaluator panels remain the place where work happens.

## Layout Direction

Use a stable evaluator layout:

- Left: run/query selection or query list
- Center: conversation map
- Right or below: selected-node detail, depending on viewport

On narrow screens, keep tabs and controls visible, then stack the map and selected-node detail.

The map should feel like an evaluator tool, not a design canvas. The reviewer should immediately understand which run and query they are looking at.

## Implementation Notes

Start with a small custom map component or a proven graph/canvas library, but keep the interaction model constrained:

- Nodes are positioned by depth and branch order.
- Reviewers can pan and zoom the map.
- Reviewers do not need to resize, rearrange, or maintain modules.
- State lives in the same selected run, selected seed query, and selected node model as the rest of the app.

If a graph library is used, configure it for this product behavior rather than exposing a generic whiteboard.

## Acceptance Criteria

- The previous evaluator sections are still available and recognizable.
- A reviewer can open a starter query and see its full follow-up tree.
- A reviewer can zoom out to see the whole tree.
- A reviewer can zoom in and select an individual query node.
- Selecting a node updates the detail/review content.
- Explicit zoom controls work without touchpad gestures.
- The app does not require dragging or arranging modules to complete evaluation work.
