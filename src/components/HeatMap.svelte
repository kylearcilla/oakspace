<script lang="ts">
	import { onMount } from 'svelte';
	import { getElemById, getHozSpace, randomArrayElem } from '$lib/utils-general';
	import {
		addToDate,
		formatDateToSimpleIso,
		getMonthStr,
		getPrevMonth,
		isDateEarlier,
		isSameDay,
		months
	} from '$lib/utils-date';
	import { randInt } from '../lib/utils-general';
	import { formatDateLong } from '../lib/utils-date';

	export let id: string;
	export let type: 'goals' | 'habits';

	const data: {
		idx: number;
		activity: number;
		text?: string;
	}[] = [
		{ idx: 2, activity: 0 },
		{ idx: 17, activity: 0 },
		{ idx: 21, activity: 0.4 },
		{ idx: 45, activity: 0.9 },
		{ idx: 11, activity: 0.3 },
		{ idx: 44, activity: 1.0 },
		{ idx: 181, activity: 0 },
		{ idx: 56, activity: 0.5 },
		{ idx: 243, activity: 0.2 },
		{ idx: 273, activity: 0 },
		{ idx: 304, activity: 0 },
		{ idx: 334, activity: 0 }
	];
	const lastTwelveMonths: Date[] = getMonths();
	const firstDay = nextClosestSaturday();
	const emojis = ['💪', '🏃‍♂️', '🇫🇷', '📖', '🌷', '🧘🏼‍♂️'];

	let container: HTMLElement;
	let firstMonthLeftOffset = -1;

	let hoverDayIdx = -1;
	let hoverDay: Date;
	let offset = {
		top: 0,
		left: 0
	};

	function getOpacity(val: number) {
		if (val >= 0.8) return 0.85;
		if (val >= 0.4) return 0.2;
		if (val >= 0.1) return 0.1;
		return 0;
	}
	function getMonths() {
		const months = [];
		let currMonth = new Date();
		for (let i = 0; i < 11; i++) {
			currMonth = getPrevMonth(new Date(currMonth));
			months.push(currMonth);
		}
		return months;
	}
	function getRenderData(idx: number) {
		const currDay = addToDate({ date: firstDay, time: `${idx === 0 ? idx : -idx}d` });
		const isAhead = isDateEarlier(new Date(), currDay);
		const dayData = randomArrayElem(data);
		const opacity = getOpacity(dayData.activity);
		const text =
			type === 'habits' ? dayData.text : randInt(0, 8) === 1 ? randomArrayElem(emojis) : '';

		if (isAhead) {
			return {
				show: false,
				opacity: 0,
				day: currDay
			};
		}
		return {
			opacity,
			show: true,
			text,
			day: currDay
		};
	}
	function nextClosestSaturday() {
		const date = new Date();
		const dayOfWeek = date.getDay();
		const daysUntilSaturday = (6 - dayOfWeek + 7) % 7 || 7;
		const nextSaturday = new Date(date);
		nextSaturday.setDate(date.getDate() + daysUntilSaturday);

		return nextSaturday;
	}
	function initMonthNames() {
		const monthNames = container.getElementsByClassName(
			'heat-map__month'
		) as unknown as HTMLElement[];

		for (let i = 0; i < lastTwelveMonths.length; i++) {
			const firstDay = lastTwelveMonths[i];
			const monthNameRef = monthNames[i];
			const matchingCell = getElemById(`cell--${id}--${formatDateToSimpleIso(firstDay)}`);
			const distFromLeft = getHozSpace({
				left: {
					elem: container,
					edge: 'left'
				},
				right: {
					elem: matchingCell!,
					edge: 'left'
				}
			});

			monthNameRef.style.left = `${distFromLeft + (type === 'goals' ? 5 : 0)}px`;
			if (i === 0) {
				firstMonthLeftOffset = distFromLeft;
			}
		}
	}

	/* pointer */
	function onPointerOver(pe: PointerEvent, day: Date, dayIdx: number) {
		const containerBox = container.getBoundingClientRect();
		const target = pe.target as HTMLElement;
		const targetBox = target.getBoundingClientRect();

		offset = {
			left: targetBox.left - containerBox.left - container.parentElement.scrollLeft,
			top: targetBox.top - containerBox.top - 30
		};
		if (dayIdx != hoverDayIdx) {
			hoverDay = day;
			hoverDayIdx = dayIdx;
		}
	}
	function onPointerLeave(pe: PointerEvent) {
		hoverDayIdx = -1;
	}

	onMount(() => {
		initMonthNames();
	});
</script>

<div style:position="relative" style:width="100%">
	<div style:width="100%" style:overflow="scroll">
		<div bind:this={container} class={`heat-map heat-map--${type}`}>
			<div class="heat-map__months">
				{#if firstMonthLeftOffset > 30}
					<div class="heat-map__month">
						{getMonthStr(new Date())}
					</div>
				{/if}
				{#each lastTwelveMonths as date}
					<div class="heat-map__month">
						{getMonthStr(date)}
					</div>
				{/each}
			</div>
			<div class="flx">
				{#each Array(52) as _, colIdx}
					<div class="heat-map__week-col">
						{#each Array(7) as _, cellIdx}
							{@const dayIdx = colIdx * 7 + cellIdx}
							{@const { show, opacity, day, text } = getRenderData(dayIdx)}
							{@const sameDay = isSameDay(new Date(), day)}
							{@const color = type === 'habits' ? `rgba(var(--fgColor1), ${opacity})` : ''}

							<button
								class="heat-map__cell-container"
								on:pointerover={(e) => onPointerOver(e, day, dayIdx)}
								on:pointerleave={onPointerLeave}
							>
								<div
									id={`cell--${id}--${formatDateToSimpleIso(day)}`}
									class="heat-map__cell"
									class:heat-map__cell--goal={type === 'goals'}
									class:heat-map__cell--ahead={!show}
									class:heat-map__cell--today={sameDay}
									style:--color={color}
								>
									<div
										class="heat-map__cell-content"
										class:heat-map__cell-content--highlight={text}
									>
										{#if text}
											<!-- <i class="fa-solid fa-star"></i> -->
											<!-- {text} -->
											<!-- {text} -->
										{/if}
									</div>
								</div>
							</button>
						{/each}
					</div>
				{/each}
			</div>
		</div>
	</div>
	{#if hoverDayIdx >= 0}
		<div
			class="tool-tip"
			on:pointerover={() => (hoverDayIdx = -1)}
			style:top={`${offset.top}px`}
			style:left={`${offset.left}px`}
		>
			<div class="tool-tip__content">
				<span>
					{formatDateLong(hoverDay)}
				</span>
			</div>
		</div>
	{/if}
</div>

<style lang="scss">
	.heat-map {
		position: relative;
		padding-bottom: 12px;

		&--habits &__months {
			margin-bottom: 3px;
		}
		&--goals &__cell-container {
			@include square(19px, 7px);
		}
		&--goals &__cell-container:hover {
			background-color: rgba(var(--textColor1), 0.06);
		}

		&__months {
			display: flex;
			height: 27px;
		}
		&__month {
			@include text-style(0.25, 400, 1.2rem, 'DM Mono');
			margin-bottom: 13px;
			position: absolute;
			top: 0px;
		}
		&__week-col {
			display: flex;
			flex-direction: column-reverse;
		}
		&__cell-container {
			position: relative;
			@include square(19px, 7px);
			@include center;
		}
		&__cell {
			width: 85%;
			height: 85%;
			position: relative;
			font-size: 0.6rem;
			border-radius: 6px;
			pointer-events: none;
			@include center;

			&--goal &-content {
				background-color: rgba(var(--textColor1), 0.04);
				height: 4.5px;
				width: 4.5px;
				font-size: 1.2rem;
			}
			&--goal#{&}--today {
				box-shadow: none;
			}
			&--ahead &-content {
				opacity: 1;
				background-color: rgba(var(--fgColor1), 0.01);
			}
			&--today {
				@include shadow-border(rgba(#0c8ce9, 1), 2px);
			}
			&--today::before {
				border-radius: 7px !important;
			}
			&::before {
				content: ' ';
				width: 100%;
				height: 100%;
				@include abs-top-left;
				border-radius: 7px;
				background-color: var(--color);
				z-index: -1;
			}
		}
		&__cell-content {
			@include center;
			height: 100%;
			width: 100%;
			border-radius: 9px;
			background-color: rgba(var(--fgColor1), 0.0285);

			&--highlight {
				background-color: rgba(var(--textColor1), 0.85) !important;
				// box-shadow: 0 0 20px 3px rgba(255, 255, 255, 0.03)
			}
		}
	}
	.tool-tip {
		@include abs-top-left(20px, 20px);
		@include text-style(0.6, 400, 1.12rem, 'DM Mono');
		@include center;
		height: 20px;
		width: 10px;

		&__content {
			padding: 5px 10px 6px 10px;
			@include abs-center;
			top: 13px;
			width: max-content;
			border-radius: 5px;
			background-color: #1a1a1a;
		}
	}
</style>
