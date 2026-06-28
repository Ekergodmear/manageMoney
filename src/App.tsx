import { useEffect, useState, type JSX } from 'react';

import { DecisionScreen } from '@/features/planner/DecisionScreen';
import { GeneratePlanScreen } from '@/features/planner/GeneratePlanScreen';
import { PlanTableScreen } from '@/features/planner/PlanTableScreen';
import {
  DEFAULT_PLANNER_FORM,
  generatePlan,
  type GenerateResult,
  type PlannerFormValues,
  type PlannerField,
} from '@/features/planner/plan-service';
import { FormRightPanel, PlanRightPanel } from '@/features/planner/RightPanel';
import { type NavItemId } from '@/features/navigation/sidebar-config';
import {
  FeaturePlaceholder,
  GuidePreviewScreen,
} from '@/features/placeholders/FeaturePlaceholder';
import { SettingsScreen } from '@/features/settings/SettingsScreen';
import { CurrentSessionScreen } from '@/features/session/CurrentSessionScreen';
import { SessionCard } from '@/features/session/SessionCard';
import { AppLayout } from '@/layout/AppLayout';
import { ComingSoonToast } from '@/components/ui/coming-soon-toast';

type CreatePhase = 'form' | 'decision' | 'plan';

export function App(): JSX.Element {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [activeNav, setActiveNav] = useState<NavItemId>('create');
  const [createPhase, setCreatePhase] = useState<CreatePhase>('form');
  const [formValues, setFormValues] = useState<PlannerFormValues>(DEFAULT_PLANNER_FORM);
  const [liveForm, setLiveForm] = useState<PlannerFormValues>(DEFAULT_PLANNER_FORM);
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<PlannerField, string>>>({});
  const [generated, setGenerated] = useState<GenerateResult | null>(null);
  const [completedThroughRound, setCompletedThroughRound] = useState(0);
  const [sessionNumber, setSessionNumber] = useState(1);
  const [sessionStartedAt, setSessionStartedAt] = useState<Date>(() => new Date());
  const [comingSoon, setComingSoon] = useState<string | null>(null);

  const hasActivePlan = generated !== null;

  useEffect(() => {
    document.querySelector('main')?.scrollTo({ top: 0, behavior: 'instant' });
  }, [activeNav, createPhase]);

  function handleNavSelect(id: NavItemId): void {
    if (id === 'create') {
      setActiveNav('create');
      if (generated !== null && createPhase === 'form') {
        setCreatePhase('plan');
      }
      return;
    }
    setActiveNav(id);
  }

  function handleGenerate(values: PlannerFormValues): void {
    setFormValues(values);
    const outcome = generatePlan(values);
    if (outcome.fieldErrors !== undefined) {
      setFieldErrors(outcome.fieldErrors);
      return;
    }
    if (outcome.result === undefined) {
      return;
    }
    setFieldErrors({});
    setCompletedThroughRound(0);
    setGenerated(outcome.result);
    setSessionNumber((n) => (generated === null ? 1 : n + 1));
    setSessionStartedAt(new Date());
    setCreatePhase('decision');
    setActiveNav('create');
  }

  function handleNewPlan(): void {
    setCreatePhase('form');
    setActiveNav('create');
  }

  function renderCreateFlow(): JSX.Element {
    if (createPhase === 'decision' && generated !== null) {
      return (
        <DecisionScreen
          generated={generated}
          onEdit={() => setCreatePhase('form')}
          onViewPlan={() => setCreatePhase('plan')}
        />
      );
    }
    if (createPhase === 'plan' && generated !== null) {
      return (
        <PlanTableScreen
          generated={generated}
          completedThroughRound={completedThroughRound}
          onToggleRound={(roundIndex, checked) =>
            setCompletedThroughRound(checked ? roundIndex : roundIndex - 1)
          }
          onResetProgress={() => setCompletedThroughRound(0)}
          onEdit={() => setCreatePhase('form')}
        />
      );
    }
    return (
      <GeneratePlanScreen
        defaultValues={formValues}
        onValuesChange={setLiveForm}
        onSubmit={handleGenerate}
        {...(fieldErrors.request !== undefined ? { serverError: fieldErrors.request } : {})}
      />
    );
  }

  function renderMain(): JSX.Element {
    switch (activeNav) {
      case 'create':
        return renderCreateFlow();
      case 'session':
        return generated !== null ? (
          <CurrentSessionScreen
            sessionNumber={sessionNumber}
            generated={generated}
            completedThroughRound={completedThroughRound}
            startedAt={sessionStartedAt}
            onContinuePlan={() => {
              setActiveNav('create');
              setCreatePhase('plan');
            }}
            onNewPlan={handleNewPlan}
            onComingSoon={setComingSoon}
          />
        ) : (
          <FeaturePlaceholder
            title="Phiên đang chơi"
            description="Đây là trung tâm theo dõi phiên — nơi bạn tiếp tục, hoàn thành hoặc xuất kết quả."
            body="Tạo kế hoạch trước để bắt đầu phiên đầu tiên."
            comingLabel="Bắt đầu từ Tạo kế hoạch."
          />
        );
      case 'improve':
        return (
          <FeaturePlaceholder
            title="Cải thiện kế hoạch"
            description="Bạn chỉ có 500.000?"
            body="Tính năng này sẽ tự tìm kế hoạch gần nhất phù hợp với vốn hiện có — giảm mục tiêu hoặc điều chỉnh số vòng thay vì bắt bạn nhập lại từ đầu."
            comingLabel="Coming soon."
          />
        );
      case 'continue':
        return (
          <FeaturePlaceholder
            title="Tiếp tục phiên"
            description="Đã chơi hết 50 vòng?"
            body="Tiếp tục lên 100 hoặc 150 vòng mà không cần tạo lại từ đầu. Vốn bổ sung và tổng vốn sau mở rộng sẽ được tính tự động."
            comingLabel="Coming soon."
          />
        );
      case 'simulation':
        return (
          <FeaturePlaceholder
            title="Mô phỏng"
            description="Nếu thắng ở vòng 37 thì chuyện gì xảy ra?"
            body="Kéo slider chọn vòng thắng — bảng và số liệu cập nhật realtime. Hiểu plan, không phải tạo plan mới."
            comingLabel="Beta preview — coming soon."
          />
        );
      case 'allocation':
        return (
          <FeaturePlaceholder
            title="Phân bổ tài khoản"
            description="Tự động chia kế hoạch cho nhiều tài khoản."
            body="Hữu ích khi game có thuế hoặc giới hạn — đề xuất 1 hoặc nhiều account và gán plan cho từng tài khoản."
            comingLabel="Coming soon."
          />
        );
      case 'game':
        return (
          <FeaturePlaceholder
            title="Game"
            description="Chọn luật game — Bingo ×20, ×120, Crash 1.95 hoặc Custom."
            body="Mỗi game tự điền minimum bet, step, reward và thuế. Bạn không phải nhập lại thủ công."
            comingLabel="Coming soon."
          />
        );
      case 'guide':
        return <GuidePreviewScreen />;
      case 'settings':
        return <SettingsScreen theme={theme} onThemeChange={(dark) => setTheme(dark ? 'dark' : 'light')} />;
      case 'history':
        return (
          <FeaturePlaceholder
            title="Lịch sử"
            description="Xem lại các phiên chơi trước đây."
            body="Lọc Won / Lost / Cancelled, tìm theo ngày hoặc lợi nhuận, mở lại session cũ."
            comingLabel="Coming in Feature 5."
          />
        );
      default:
        return renderCreateFlow();
    }
  }

  const showSessionCard =
    hasActivePlan && (activeNav === 'create' || activeNav === 'session');

  const showRightPanel =
    activeNav === 'create' ||
    activeNav === 'session' ||
    activeNav === 'improve' ||
    activeNav === 'simulation';

  const rightPanel =
    activeNav === 'create' && createPhase === 'form' ? (
      <FormRightPanel form={liveForm} />
    ) : hasActivePlan &&
      (activeNav === 'create' ||
        activeNav === 'session' ||
        activeNav === 'improve' ||
        activeNav === 'simulation') ? (
      <PlanRightPanel generated={generated!} completedThroughRound={completedThroughRound} />
    ) : (
      <FormRightPanel form={formValues} />
    );

  return (
    <>
      <AppLayout
        activeNav={activeNav}
        onNavSelect={handleNavSelect}
        hasActivePlan={hasActivePlan}
        theme={theme}
        onThemeChange={(dark) => setTheme(dark ? 'dark' : 'light')}
        showRightPanel={showRightPanel}
        main={
          <div className="space-y-4">
            {showSessionCard && generated !== null ? (
              <SessionCard
                sessionNumber={sessionNumber}
                generated={generated}
                completedThroughRound={completedThroughRound}
                startedAt={sessionStartedAt}
              />
            ) : null}
            {renderMain()}
          </div>
        }
        rightPanel={rightPanel}
      />
      {comingSoon !== null ? (
        <ComingSoonToast message={comingSoon} onClose={() => setComingSoon(null)} />
      ) : null}
    </>
  );
}
